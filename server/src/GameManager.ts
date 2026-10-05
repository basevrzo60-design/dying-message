import { v4 as uuid } from "uuid";
import { randomInt, timingSafeEqual, scryptSync } from "node:crypto";
import {
  GOODS,
  legalGoods,
  HAND_SIZE,
  MAX_EXCHANGE,
  goodLabel,
} from "../../shared/goods.js";
import type { Good, Player, Room, Snapshot } from "../../shared/types.js";
interface InternalPlayer extends Player {
  socketId: string;
  token: string;
  hand: Good[];
  bag: Good[];
  bot: boolean;
}
interface InternalRoom extends Omit<Room, "players"> {
  players: InternalPlayer[];
  password: Buffer;
  salt: string;
  deck: Good[];
  discardPile: Good[];
  turnIndex: number;
  lastActive: number;
}
function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw Error(message);
}
export class GameManager {
  rooms = new Map<string, InternalRoom>();
  text(v: unknown, label: string, max = 32) {
    check(
      typeof v === "string" && v.trim().length > 0 && v.trim().length <= max,
      `${label} must be 1–${max} characters`,
    );
    return v.trim();
  }
  create(socketId: string, data: any) {
    const name = this.text(data.playerName, "Player name", 20),
      roomName = this.text(data.roomName, "Room name");
    check(
      Number.isInteger(data.maxPlayers) &&
        data.maxPlayers >= 3 &&
        data.maxPlayers <= 6,
      "Choose 3–6 players",
    );
    const salt = uuid();
    const password = data.isPrivate
      ? this.text(data.password, "Password", 64)
      : "";
    let id: string;
    do {
      id = "SHF-" + uuid().slice(0, 6).toUpperCase();
    } while (this.rooms.has(id));
    const room: InternalRoom = {
      id,
      name: roomName,
      maxPlayers: data.maxPlayers,
      isPrivate: !!data.isPrivate,
      password: scryptSync(password, salt, 32),
      salt,
      status: "lobby",
      players: [],
      round: 0,
      maxRounds: 0,
      currentSheriffId: "",
      currentMerchantId: "",
      phase: "LOBBY",
      eventLog: [],
      messages: [],
      revealed: [],
      deck: [],
      discardPile: [],
      turnIndex: 0,
      demo: !!data.demo && process.env.NODE_ENV !== "production",
      lastActive: Date.now(),
      deckCount: 0,
      discardCount: 0,
    };
    this.rooms.set(id, room);
    const player = this.add(room, socketId, name);
    if (room.demo)
      for (const n of ["โรบิน", "มาเรียน", "ลิตเติลจอห์น"]) {
        const p = this.add(room, "bot-" + uuid(), n);
        p.bot = true;
        p.isReady = true;
      }
    return { room, player };
  }
  add(room: InternalRoom, socketId: string, name: string) {
    const p: InternalPlayer = {
      id: uuid(),
      token: uuid(),
      socketId,
      name,
      avatar: ["🧔🏻", "👩🏽", "🧑🏻", "👨🏾", "👩🏻‍🦰", "🧔🏽"][room.players.length],
      coins: 50,
      score: 50,
      bonus: 0,
      isHost: !room.players.length,
      isReady: false,
      isConnected: true,
      role: "Merchant",
      merchantStand: [],
      contraband: [],
      handCount: 0,
      bagCount: 0,
      bribe: 0,
      hand: [],
      bag: [],
      bot: false,
    };
    room.players.push(p);
    return p;
  }
  join(socketId: string, data: any) {
    const room = this.rooms.get(
      this.text(data.roomId, "Room code").toUpperCase(),
    );
    check(room, "Room not found");
    check(room.status === "lobby", "Game already started");
    check(room.players.length < room.maxPlayers, "Room is full");
    if (room.isPrivate)
      check(
        typeof data.password === "string" &&
          data.password.length <= 64 &&
          timingSafeEqual(
            room.password,
            scryptSync(data.password, room.salt, 32),
          ),
        "Incorrect password",
      );
    const name = this.text(data.playerName, "Player name", 20);
    check(
      !room.players.some((p) => p.name.toLowerCase() === name.toLowerCase()),
      "Player name is already taken",
    );
    return { room, player: this.add(room, socketId, name) };
  }
  auth(socketId: string) {
    for (const room of this.rooms.values()) {
      const player = room.players.find(
        (p) => p.socketId === socketId && p.isConnected,
      );
      if (player) {
        room.lastActive = Date.now();
        return { room, player };
      }
    }
    throw Error("Join a room first");
  }
  rejoin(socketId: string, data: any) {
    const room = this.rooms.get(data.roomId);
    const player = room?.players.find(
      (p) => p.id === data.playerId && p.token === data.token,
    );
    check(room && player, "Your session has expired");
    check(
      !player.isConnected || player.socketId === socketId,
      "This player is already connected in another tab",
    );
    player.socketId = socketId;
    player.isConnected = true;
    return { room, player };
  }
  log(r: InternalRoom, t: string) {
    r.eventLog = [...r.eventLog, t].slice(-80);
  }
  snapshot(r: InternalRoom, p: InternalPlayer): Snapshot {
    return {
      playerId: p.id,
      privatePlayer: { hand: p.hand, bag: p.bag },
      room: {
        id: r.id,
        name: r.name,
        maxPlayers: r.maxPlayers,
        isPrivate: r.isPrivate,
        status: r.status,
        players: r.players.map(
          ({
            hand,
            bag,
            token: _token,
            socketId: _socketId,
            bot: _bot,
            ...publicPlayer
          }) => ({
            ...publicPlayer,
            handCount: hand.length,
            bagCount: bag.length,
          }),
        ),
        round: r.round,
        maxRounds: r.maxRounds,
        currentSheriffId: r.currentSheriffId,
        currentMerchantId: r.currentMerchantId,
        phase: r.phase,
        eventLog: r.eventLog,
        messages: r.messages,
        winner: r.winner,
        revealed: r.revealed,
        demo: r.demo,
        deckCount: r.deck.length,
        discardCount: r.discardPile.length,
      },
    };
  }
  deck() {
    const cards: Good[] = [];
    GOODS.forEach(({ name, value, penalty, icon: image, type, copies }) => {
      for (let j = 0; j < copies; j++)
        cards.push({
          id: uuid(),
          name,
          value,
          penalty,
          image,
          type,
        });
    });
    for (let i = cards.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }
  draw(r: InternalRoom, p: InternalPlayer) {
    while (p.hand.length < HAND_SIZE) {
      if (!r.deck.length) {
        r.deck = r.discardPile.splice(0);
        for (let i = r.deck.length - 1; i > 0; i--) {
          const j = randomInt(i + 1);
          [r.deck[i], r.deck[j]] = [r.deck[j], r.deck[i]];
        }
      }
      const card = r.deck.pop();
      if (!card) break;
      p.hand.push(card);
    }
  }
  start(r: InternalRoom, p: InternalPlayer) {
    check(p.isHost, "Only the host can start");
    check(r.status === "lobby", "Game already started");
    check(
      r.players.length >= 3 &&
        r.players.every((p) => p.isReady && p.isConnected),
      "At least 3 connected, ready players are required",
    );
    r.status = "playing";
    r.round = 1;
    r.maxRounds = r.players.length;
    r.deck = this.deck();
    r.discardPile = [];
    r.winner = undefined;
    r.eventLog = [];
    for (const p of r.players) {
      p.coins = 50;
      p.score = 50;
      p.hand = [];
      p.bag = [];
      p.merchantStand = [];
      p.contraband = [];
      p.bonus = 0;
      this.draw(r, p);
    }
    this.round(r);
  }
  round(r: InternalRoom) {
    r.currentSheriffId = r.players[(r.round - 1) % r.players.length].id;
    r.players.forEach(
      (p) => (p.role = p.id === r.currentSheriffId ? "Sheriff" : "Merchant"),
    );
    r.turnIndex = 0;
    this.turn(r);
    this.log(
      r,
      `รอบที่ ${r.round}: ${r.players.find((p) => p.id === r.currentSheriffId)!.name} เป็นนายอำเภอ`,
    );
  }
  turn(r: InternalRoom) {
    const merchant = r.players.filter((p) => p.id !== r.currentSheriffId)[
      r.turnIndex
    ];
    r.currentMerchantId = merchant.id;
    r.phase = "DRAW";
    r.revealed = [];
    merchant.bag = [];
    merchant.bribe = 0;
    merchant.declaredGoods = undefined;
  }
  action(r: InternalRoom, p: InternalPlayer, event: string, data: any = {}) {
    check(r.status === "playing", "The game is not active");
    const m = r.players.find((p) => p.id === r.currentMerchantId)!;
    const s = r.players.find((p) => p.id === r.currentSheriffId)!;
    if (
      [
        "draw_cards",
        "select_goods",
        "seal_bag",
        "declare_goods",
        "offer_bribe",
      ].includes(event)
    )
      check(p.id === m.id, "Not your turn");
    if (
      ["accept_bag", "inspect_bag", "accept_bribe", "reject_bribe"].includes(
        event,
      )
    )
      check(p.id === s.id, "Only the Sheriff can decide");
    if (event === "draw_cards") {
      check(r.phase === "DRAW", "จั่วการ์ดได้เพียงครั้งเดียวก่อนจัดถุง");
      check(
        Array.isArray(data.ids) &&
          data.ids.length <= MAX_EXCHANGE &&
          new Set(data.ids).size === data.ids.length,
        "เลือกทิ้งการ์ดได้ไม่เกิน 3 ใบและห้ามซ้ำ",
      );
      check(
        data.ids.every((id: unknown) => p.hand.some((c) => c.id === id)),
        "ไม่พบการ์ดที่เลือกในมือ",
      );
      const discarded = p.hand.filter((c) => data.ids.includes(c.id));
      const needed = HAND_SIZE - (p.hand.length - discarded.length);
      check(
        r.deck.length + r.discardPile.length >= needed,
        "การ์ดในกองจั่วไม่เพียงพอ",
      );
      p.hand = p.hand.filter((c) => !data.ids.includes(c.id));
      this.draw(r, p);
      r.discardPile.push(...discarded);
      r.phase = "SELECT_GOODS";
      this.log(
        r,
        `${p.name} ทิ้งการ์ด ${discarded.length} ใบ และจั่ว ${needed} ใบ`,
      );
    } else if (event === "select_goods" || event === "seal_bag") {
      check(r.phase === "SELECT_GOODS", "Bag is already sealed");
      check(
        Array.isArray(data.ids) &&
          data.ids.length <= 5 &&
          new Set(data.ids).size === data.ids.length,
        "Choose up to 5 different cards",
      );
      check(
        data.ids.every((id: unknown) => p.hand.some((c) => c.id === id)),
        "Invalid goods",
      );
      p.bag = p.hand.filter((c) => data.ids.includes(c.id));
      if (event === "seal_bag") {
        check(p.bag.length >= 1, "Choose at least one card");
        p.hand = p.hand.filter((c) => !data.ids.includes(c.id));
        r.phase = "DECLARE";
        this.log(r, `${p.name} ปิดถุงสินค้า ${p.bag.length} ใบ`);
      }
    } else if (event === "declare_goods") {
      check(r.phase === "DECLARE", "Not the declaration phase");
      check(
        legalGoods.some((c) => c.name === data.good),
        "Declare a legal good",
      );
      check(
        data.quantity === p.bag.length,
        "You must declare the actual number of cards",
      );
      p.declaredGoods = data.good;
      r.phase = "BRIBE";
      this.log(r, `${p.name} สำแดง${goodLabel(data.good)} ${p.bag.length} ใบ`);
    } else if (event === "offer_bribe") {
      check(r.phase === "BRIBE", "Not the bribe phase");
      check(
        Number.isInteger(data.amount) &&
          data.amount >= 0 &&
          data.amount <= p.coins,
        "Invalid bribe amount",
      );
      p.bribe = data.amount;
      r.phase = "SHERIFF_DECISION";
      this.log(r, `${p.name} เสนอสินบน ${p.bribe} เหรียญ`);
    } else if (event === "reject_bribe") {
      check(
        r.phase === "SHERIFF_DECISION" && m.bribe > 0,
        "No bribe to reject",
      );
      m.bribe = 0;
      this.log(r, "นายอำเภอปฏิเสธสินบน");
    } else if (["accept_bag", "inspect_bag", "accept_bribe"].includes(event)) {
      check(r.phase === "SHERIFF_DECISION", "Waiting for the merchant");
      if (event === "accept_bribe") check(m.bribe > 0, "No bribe offered");
      if (event === "inspect_bag") {
        r.revealed = [...m.bag];
        const wrong = m.bag.filter((c) => c.name !== m.declaredGoods);
        const penalty = (wrong.length ? wrong : m.bag).reduce(
          (a, c) => a + c.penalty,
          0,
        );
        const payer = wrong.length ? m : s,
          payee = wrong.length ? s : m;
        const paid = Math.min(payer.coins, penalty);
        payer.coins -= paid;
        payee.coins += paid;
        m.merchantStand.push(
          ...m.bag.filter((c) => c.name === m.declaredGoods),
        );
        r.discardPile.push(...wrong);
        this.log(
          r,
          `${s.name} ตรวจถุงของ ${m.name}: พบสินค้าไม่ตรงคำสำแดง ${wrong.length} ใบ · ${payer.name} จ่าย ${paid} เหรียญ`,
        );
      } else {
        if (event === "accept_bribe") {
          m.coins -= m.bribe;
          s.coins += m.bribe;
        }
        m.merchantStand.push(...m.bag.filter((c) => c.type === "legal"));
        m.contraband.push(...m.bag.filter((c) => c.type === "contraband"));
        this.log(
          r,
          `${s.name} ปล่อยถุงของ ${m.name} ผ่านด่าน${event === "accept_bribe" ? ` และรับสินบน ${m.bribe} เหรียญ` : " โดยไม่รับสินบน"}`,
        );
      }
      m.bag = [];
      r.phase = "INSPECTION_RESULT";
      this.scores(r);
    } else throw Error("Unsupported action");
  }
  advance(r: InternalRoom) {
    if (r.status !== "playing" || r.phase !== "INSPECTION_RESULT") return;
    r.turnIndex++;
    if (r.turnIndex >= r.players.length - 1) {
      r.round++;
      if (r.round > r.maxRounds) {
        r.round = r.maxRounds;
        r.status = "finished";
        r.phase = "GAME_OVER";
        this.scores(r, true);
        r.winner = [...r.players].sort((a, b) => b.score - a.score)[0].id;
        return;
      }
      this.round(r);
    } else this.turn(r);
  }
  scores(r: InternalRoom, final = false) {
    if (final) {
      for (const { name } of legalGoods) {
        const counts = r.players.map(
          (p) => p.merchantStand.filter((c) => c.name === name).length,
        );
        const max = Math.max(...counts);
        if (max > 0) {
          const winners = r.players.filter((_, i) => counts[i] === max);
          winners.forEach((p) => (p.bonus += Math.floor(10 / winners.length)));
        }
      }
    }
    r.players.forEach(
      (p) =>
        (p.score =
          p.coins +
          [...p.merchantStand, ...p.contraband].reduce(
            (a, c) => a + c.value,
            0,
          ) +
          p.bonus),
    );
  }
  leave(socketId: string, explicit = false) {
    const { room: r, player: p } = this.auth(socketId);
    p.isConnected = false;
    if (r.status === "lobby" && explicit)
      r.players = r.players.filter((x) => x.id !== p.id);
    if (p.isHost) {
      const next = r.players.find((x) => x.isConnected && !x.bot);
      if (next) {
        p.isHost = false;
        next.isHost = true;
      }
    }
    this.log(r, `${p.name} ออฟไลน์`);
    if (!r.players.length) this.rooms.delete(r.id);
    return r;
  }
}
