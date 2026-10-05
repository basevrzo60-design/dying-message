import { randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import {
  henchmenFor,
  type CheesePhase,
  type CheeseRole,
  type CheeseSession,
  type CheeseView,
} from "../../shared/cheese.js";
type Person = {
  id: string;
  token: string;
  socketId: string | null;
  name: string;
  ready: boolean;
  role: CheeseRole;
  hour: number;
  confirmed: boolean;
  nightDone: boolean;
  peek: { id: string; hour: number } | null;
  knownCompanions: string[];
  vote: string | null;
  departed?: boolean;
};
export type CheeseRoom = {
  code: string;
  name: string;
  capacity: number;
  hostId: string;
  players: Person[];
  phase: CheesePhase;
  hour: number;
  round: number;
  auto: boolean;
  deadline: number | null;
  lastActive: number;
};
export class CheeseManager {
  rooms = new Map<string, CheeseRoom>();
  constructor(private rng: (max: number) => number = randomInt) {}
  text(value: unknown, label: string, max: number) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > max)
      throw Error(`${label}ไม่ถูกต้อง`);
    return value.trim();
  }
  auth(socketId: string) {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) return { room, player };
    }
    throw Error("กรุณาเข้าห้องก่อน");
  }
  private free(socketId: string) {
    for (const room of this.rooms.values())
      if (room.players.some((p) => p.socketId === socketId))
        throw Error("คุณอยู่ในห้องแล้ว");
  }
  private person(socketId: string, name: string): Person {
    return {
      id: randomUUID(),
      token: randomUUID(),
      socketId,
      name,
      ready: false,
      role: "mouse",
      hour: 1,
      confirmed: false,
      nightDone: false,
      peek: null,
      knownCompanions: [],
      vote: null,
    };
  }
  credentials(room: CheeseRoom, p: Person): CheeseSession {
    return { code: room.code, id: p.id, token: p.token };
  }
  create(socketId: string, data: Record<string, unknown>) {
    this.free(socketId);
    const name = this.text(data.playerName, "ชื่อผู้เล่น", 24);
    const roomName = this.text(data.roomName, "ชื่อห้อง", 40);
    const capacity = data.capacity;
    if (
      typeof capacity !== "number" ||
      !Number.isInteger(capacity) ||
      capacity < 4 ||
      capacity > 8
    )
      throw Error("ห้องรองรับ 4–8 คน");
    let code: string;
    do {
      code = randomInt(100000, 1000000).toString();
    } while (this.rooms.has(code));
    const player = this.person(socketId, name);
    const room: CheeseRoom = {
      code,
      name: roomName,
      capacity,
      hostId: player.id,
      players: [player],
      phase: "lobby",
      hour: 0,
      round: 0,
      auto: false,
      deadline: null,
      lastActive: Date.now(),
    };
    this.rooms.set(code, room);
    return { room, player };
  }
  join(socketId: string, data: Record<string, unknown>) {
    this.free(socketId);
    const code = this.text(data.code, "รหัสห้อง", 6);
    const room = this.rooms.get(code);
    if (!room) throw Error("ไม่พบห้องนี้ ตรวจรหัสอีกครั้ง");
    if (room.phase !== "lobby") throw Error("ห้องนี้เริ่มเล่นแล้ว");
    if (room.players.length >= room.capacity) throw Error("ห้องเต็มแล้ว");
    const name = this.text(data.playerName, "ชื่อผู้เล่น", 24);
    if (
      room.players.some(
        (p) => p.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    )
      throw Error("ชื่อนี้มีคนใช้ในห้องแล้ว");
    const player = this.person(socketId, name);
    room.players.push(player);
    room.lastActive = Date.now();
    return { room, player };
  }
  rejoin(socketId: string, data: Record<string, unknown>) {
    this.free(socketId);
    const room = this.rooms.get(String(data.code));
    const player = room?.players.find((p) => p.id === data.id);
    if (
      !room ||
      !player ||
      typeof data.token !== "string" ||
      Buffer.byteLength(data.token) !== Buffer.byteLength(player.token) ||
      !timingSafeEqual(Buffer.from(data.token), Buffer.from(player.token))
    )
      throw Error("คืนที่นั่งไม่ได้ ห้องอาจปิดแล้ว");
    if (player.socketId) throw Error("ที่นั่งนี้เปิดใช้งานอยู่ในเครื่องอื่น");
    player.socketId = socketId;
    if (!room.players.some((p) => p.id === room.hostId && p.socketId)) room.hostId = player.id;
    room.lastActive = Date.now();
    if (room.auto && room.phase === "night" && !this.paused(room))
      room.deadline = Date.now() + 30000;
    return { room, player };
  }
  paused(room: CheeseRoom) {
    return (
      room.phase !== "lobby" &&
      room.phase !== "result" &&
      room.players.some((p) => !p.socketId)
    );
  }
  disconnect(socketId: string) {
    let found;
    try {
      found = this.auth(socketId);
    } catch {
      return null;
    }
    const { room, player } = found;
    player.socketId = null;
    room.deadline = null;
    room.lastActive = Date.now();
    if (room.hostId === player.id)
      room.hostId = room.players.find((p) => p.socketId)?.id ?? player.id;
    return room;
  }
  leave(socketId: string) {
    const { room, player } = this.auth(socketId);
    if (!["lobby", "result"].includes(room.phase))
      throw Error("ระหว่างเกมต้องรอจนจบรอบก่อนออกจากห้อง");
    if (room.phase === 'result') {
      player.socketId = null;
      player.departed = true;
      player.token = randomUUID();
    } else room.players = room.players.filter((p) => p !== player);
    if (room.hostId === player.id)
      room.hostId =
        room.players.find((p) => p.socketId)?.id ?? room.players[0]?.id ?? "";
    if (!room.players.length || room.players.every(p => p.departed)) this.rooms.delete(room.code);
    return room;
  }
  private enterHour(room: CheeseRoom) {
    room.deadline = room.auto ? Date.now() + 30000 : null;
    const awake = room.players.filter((p) => p.hour === room.hour);
    for (const p of room.players) {
      p.nightDone = false;
      if (p.hour === room.hour)
        p.knownCompanions = awake.filter((q) => q !== p).map((q) => q.id);
    }
  }
  advance(room: CheeseRoom) {
    if (room.phase !== "night" || this.paused(room)) return;
    if (room.hour === 6) {
      room.phase = "recruit";
      room.auto = false;
      room.deadline = null;
    } else {
      room.hour++;
      this.enterHour(room);
    }
  }
  action(socketId: string, event: string, data: Record<string, unknown> = {}) {
    const { room, player: p } = this.auth(socketId);
    const host = () => {
      if (room.hostId !== p.id) throw Error("เฉพาะเจ้าของห้องเท่านั้น");
    };
    const phase = (value: CheesePhase) => {
      if (room.phase !== value) throw Error("ยังทำรายการนี้ในช่วงนี้ไม่ได้");
    };
    if (this.paused(room)) throw Error("รอผู้เล่นที่หลุดกลับเข้าห้องก่อน");
    switch (event) {
      case "ready":
        phase("lobby");
        p.ready = !p.ready;
        break;
      case "start": {
        host();
        phase("lobby");
        if (
          room.players.length < 4 ||
          room.players.some((p) => !p.ready || !p.socketId)
        )
          throw Error("ต้องมี 4–8 คนและทุกคนกดพร้อม");
        const leader = this.rng(room.players.length);
        room.players.forEach((q, i) =>
          Object.assign(q, {
            role: i === leader ? "leader" : "mouse",
            hour: this.rng(6) + 1,
            confirmed: false,
            nightDone: false,
            peek: null,
            knownCompanions: [],
            vote: null,
          }),
        );
        room.round++;
        room.phase = "reveal";
        room.hour = 0;
        room.auto = false;
        room.deadline = null;
        break;
      }
      case "confirm":
        phase("reveal");
        p.confirmed = true;
        if (room.players.every((q) => q.confirmed)) {
          room.phase = "night";
          room.hour = 1;
          this.enterHour(room);
        }
        break;
      case "peek": {
        phase("night");
        if (
          p.hour !== room.hour ||
          room.players.filter((q) => q.hour === room.hour).length !== 1 ||
          p.peek ||
          p.nightDone
        )
          throw Error("ดูเวลาได้ครั้งเดียว เฉพาะตอนที่คุณตื่นคนเดียว");
        const target = room.players.find(
          (q) => q.id === data.targetId && q !== p,
        );
        if (!target) throw Error("เลือกผู้เล่นคนอื่นหนึ่งคน");
        p.peek = { id: target.id, hour: target.hour };
        break;
      }
      case "night_done":
        phase("night");
        if (p.hour !== room.hour) throw Error("ยังไม่ใช่เวลาตื่นของคุณ");
        p.nightDone = true;
        break;
      case "next":
        host();
        phase("night");
        if (room.players.some((q) => q.hour === room.hour && !q.nightDone))
          throw Error("รอผู้ที่ตื่นกดเสร็จแล้ว หรือใช้อัตโนมัติ 30 วินาที");
        this.advance(room);
        break;
      case "auto":
        host();
        phase("night");
        room.auto = !room.auto;
        room.deadline = room.auto ? Date.now() + 30000 : null;
        break;
      case "recruit": {
        phase("recruit");
        if (p.role !== "leader") throw Error("เฉพาะหัวหน้าโจรเท่านั้น");
        const ids = data.ids;
        if (
          !Array.isArray(ids) ||
          ids.length !== henchmenFor(room.players.length) ||
          new Set(ids).size !== ids.length ||
          ids.some(
            (id) =>
              typeof id !== "string" ||
              !room.players.some((q) => q.id === id && q !== p),
          )
        )
          throw Error(
            `เลือกลูกน้องให้ครบ ${henchmenFor(room.players.length)} คน โดยไม่ซ้ำและไม่เลือกตัวเอง`,
          );
        for (const q of room.players)
          if (ids.includes(q.id)) q.role = "henchman";
        room.phase = "morning";
        break;
      }
      case "open_vote":
        host();
        phase("morning");
        room.phase = "vote";
        break;
      case "vote":
        phase("vote");
        if (p.vote) throw Error("คุณลงคะแนนแล้ว");
        if (!room.players.some((q) => q.id === data.targetId))
          throw Error("เลือกผู้ต้องสงสัยหนึ่งคน");
        p.vote = String(data.targetId);
        if (room.players.every((q) => q.vote)) room.phase = "result";
        break;
      case "restart":
        host();
        phase("result");
        room.players = room.players.filter(q => !q.departed);
        room.phase = "lobby";
        room.hour = 0;
        room.players.forEach((q) =>
          Object.assign(q, {
            ready: false,
            confirmed: false,
            role: "mouse",
            hour: 1,
            peek: null,
            knownCompanions: [],
            vote: null,
          }),
        );
        break;
      case "remove":
        host();
        phase("lobby");
        {
          const target = room.players.find((q) => q.id === data.targetId);
          if (!target || target.socketId)
            throw Error("นำออกได้เฉพาะผู้ที่หลุดในล็อบบี้");
          room.players = room.players.filter((q) => q !== target);
        }
        break;
      default:
        throw Error("ไม่รู้จักคำสั่งนี้");
    }
    room.lastActive = Date.now();
    return room;
  }
  snapshot(room: CheeseRoom, p: Person): CheeseView {
    const awake = room.phase === "night" && p.hour === room.hour;
    const companions = awake
      ? room.players
          .filter((q) => q.hour === room.hour && q !== p)
          .map((q) => q.id)
      : [];
    let result: CheeseView["result"] = null;
    if (room.phase === "result") {
      const rows = room.players.map((q) => ({
        id: q.id,
        role: q.role,
        hour: q.hour,
        votes: room.players.filter((v) => v.vote === q.id).length,
      }));
      const max = Math.max(...rows.map((q) => q.votes));
      const leaders = rows.filter((q) => q.votes === max);
      result = {
        winner:
          leaders.length === 1 && leaders[0].role === "leader"
            ? "mice"
            : "thieves",
        accused: leaders.length === 1 ? leaders[0].id : null,
        tied: leaders.length !== 1,
        players: rows,
      };
    }
    const recruited = ["morning", "vote", "result"].includes(room.phase);
    return {
      code: room.code,
      name: room.name,
      capacity: room.capacity,
      hostId: room.hostId,
      round: room.round,
      phase: room.phase,
      hour: room.hour,
      auto: room.auto,
      deadline: room.deadline,
      paused: this.paused(room),
      players: room.players.map((q) => ({
        id: q.id,
        name: q.name,
        connected: !!q.socketId,
        ready: q.ready,
      })),
      henchmenCount: henchmenFor(room.players.length),
      confirmedCount: room.players.filter((q) => q.confirmed).length,
      voteCount: room.players.filter((q) => q.vote).length,
      me: {
        id: p.id,
        role: room.phase === "lobby" ? null : p.role,
        hour: room.phase === "lobby" ? null : p.hour,
        confirmed: p.confirmed,
        awake,
        companions,
        canPeek: awake && companions.length === 0 && !p.peek && !p.nightDone,
        nightDone: p.nightDone,
        peek: p.peek,
        knownCompanions: p.knownCompanions,
        team:
          recruited && p.role !== "mouse"
            ? room.players.filter((q) => q.role !== "mouse").map((q) => q.id)
            : [],
        voted: !!p.vote,
      },
      result,
    };
  }
}
