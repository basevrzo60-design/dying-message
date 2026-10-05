import { test } from "node:test";
import assert from "node:assert/strict";
import { GameManager } from "./GameManager.js";
import { GOODS, HAND_SIZE } from "../../shared/goods.js";
function table(draw = true) {
  const gm = new GameManager();
  const { room, player } = gm.create("s1", {
    playerName: "John",
    roomName: "Test",
    maxPlayers: 3,
  });
  gm.join("s2", { roomId: room.id, playerName: "Mike" });
  gm.join("s3", { roomId: room.id, playerName: "Anna" });
  room.players.forEach((p) => (p.isReady = true));
  gm.start(room, player);
  if (draw) gm.action(room, room.players[1], "draw_cards", { ids: [] });
  return { gm, room, player };
}
test("private room validates password and duplicate names", () => {
  const gm = new GameManager();
  const { room } = gm.create("a", {
    playerName: "A",
    roomName: "Private",
    maxPlayers: 3,
    isPrivate: true,
    password: "secret",
  });
  assert.throws(() =>
    gm.join("b", { roomId: room.id, playerName: "B", password: "wrong" }),
  );
  assert.throws(() =>
    gm.join("b", { roomId: room.id, playerName: "a", password: "secret" }),
  );
  gm.join("b", { roomId: room.id, playerName: "B", password: "secret" });
});
test("expanded deck has 12 goods, 216 unique cards and consistent definitions", () => {
  const gm = new GameManager(),
    deck = gm.deck();
  assert.equal(deck.length, 216);
  assert.equal(new Set(deck.map((c) => c.id)).size, 216);
  assert.equal(new Set(deck.map((c) => c.name)).size, 12);
  for (const good of GOODS) {
    const cards = deck.filter((c) => c.name === good.name);
    assert.equal(cards.length, good.copies);
    assert.ok(
      cards.every(
        (c) =>
          c.value === good.value &&
          c.penalty === good.penalty &&
          c.type === good.type,
      ),
    );
  }
});
test("draw is private, limited to the merchant and can only happen once", () => {
  const { gm, room, player } = table(false),
    m = room.players[1];
  const original = m.hand.map((c) => c.id),
    deckSize = room.deck.length;
  assert.equal(room.phase, "DRAW");
  assert.throws(() => gm.action(room, player, "draw_cards", { ids: [] }));
  assert.throws(() => gm.action(room, m, "seal_bag", { ids: [original[0]] }));
  for (const ids of [
    ["fake"],
    [original[0], original[0]],
    original.slice(0, 4),
  ])
    assert.throws(() => gm.action(room, m, "draw_cards", { ids }));
  assert.deepEqual(
    m.hand.map((c) => c.id),
    original,
  );
  gm.action(room, m, "draw_cards", { ids: original.slice(0, 3) });
  assert.equal(m.hand.length, HAND_SIZE);
  assert.equal(room.deck.length, deckSize - 3);
  assert.equal(room.discardPile.length, 3);
  assert.ok(m.hand.every((c) => !original.slice(0, 3).includes(c.id)));
  assert.equal(room.phase, "SELECT_GOODS");
  assert.throws(() => gm.action(room, m, "draw_cards", { ids: [] }));
  const view = gm.snapshot(room, player);
  assert.equal(view.room.deckCount, deckSize - 3);
  assert.equal(view.room.discardCount, 3);
  assert.equal("deck" in view.room, false);
  assert.equal("discardPile" in view.room, false);
  assert.ok(
    original.slice(0, 3).every((id) => !JSON.stringify(view).includes(id)),
  );
});
test("draw refills short hands and recycles discards without losing cards", () => {
  const { gm, room } = table(false),
    m = room.players[1];
  room.discardPile.push(...room.deck.splice(0), ...m.hand.splice(5));
  const total = room.discardPile.length;
  gm.action(room, m, "draw_cards", { ids: [] });
  assert.equal(m.hand.length, 8);
  assert.equal(room.deck.length, total - 3);
  assert.equal(room.discardPile.length, 0);
});
test("new legal goods can be declared and contraband cannot", () => {
  const { gm, room, player } = table(),
    m = room.players[1];
  const fish = room.deck.find((c) => c.name === "Fish")!;
  room.deck = room.deck.filter((c) => c.id !== fish.id);
  m.hand.push(fish);
  gm.action(room, m, "seal_bag", { ids: [fish.id] });
  assert.throws(() =>
    gm.action(room, m, "declare_goods", { good: "Jewels", quantity: 1 }),
  );
  gm.action(room, m, "declare_goods", { good: "Fish", quantity: 1 });
  gm.action(room, m, "offer_bribe", { amount: 0 });
  gm.action(room, player, "inspect_bag");
  assert.equal(m.coins, 53);
  assert.equal(player.coins, 47);
  assert.equal(m.merchantStand[0].name, "Fish");
});
test("snapshots never expose another player’s hand, token, or bag contents", () => {
  const { gm, room, player } = table();
  const snapshot = gm.snapshot(room, player);
  assert.equal(snapshot.privatePlayer.hand.length, 8);
  for (const p of snapshot.room.players) {
    assert.equal("hand" in p, false);
    assert.equal("bag" in p, false);
    assert.equal("token" in p, false);
    assert.equal("socketId" in p, false);
  }
  assert.equal("deck" in snapshot.room, false);
  assert.equal("password" in snapshot.room, false);
});
test("reject unauthorized, forged and post-seal actions", () => {
  const { gm, room, player } = table();
  const m = room.players[1];
  assert.throws(() =>
    gm.action(room, player, "seal_bag", { ids: [player.hand[0].id] }),
  );
  assert.throws(() => gm.action(room, m, "seal_bag", { ids: ["fake"] }));
  gm.action(room, m, "seal_bag", { ids: [m.hand[0].id] });
  assert.throws(() => gm.action(room, m, "seal_bag", { ids: [] }));
  assert.throws(() =>
    gm.action(room, m, "declare_goods", { good: "Pepper", quantity: 1 }),
  );
  assert.throws(() =>
    gm.action(room, m, "declare_goods", { good: "Apple", quantity: 2 }),
  );
});
test("honest inspection compensates merchant and conserves coins", () => {
  const { gm, room, player } = table();
  const m = room.players[1];
  m.hand[0] = {
    id: "apple",
    name: "Apple",
    value: 2,
    penalty: 2,
    type: "legal",
    image: "🍎",
  };
  gm.action(room, m, "seal_bag", { ids: ["apple"] });
  gm.action(room, m, "declare_goods", { good: "Apple", quantity: 1 });
  gm.action(room, m, "offer_bribe", { amount: 10 });
  assert.throws(() => gm.action(room, m, "inspect_bag"));
  gm.action(room, player, "inspect_bag");
  assert.equal(m.coins, 52);
  assert.equal(player.coins, 48);
  assert.equal(m.merchantStand.length, 1);
  assert.equal(room.phase, "INSPECTION_RESULT");
  assert.throws(() => gm.action(room, player, "inspect_bag"));
});
test("dishonest inspection confiscates undeclared goods", () => {
  const { gm, room, player } = table();
  const m = room.players[1];
  m.hand[0] = {
    id: "silk",
    name: "Silk",
    value: 8,
    penalty: 4,
    type: "contraband",
    image: "🧶",
  };
  gm.action(room, m, "seal_bag", { ids: ["silk"] });
  gm.action(room, m, "declare_goods", { good: "Apple", quantity: 1 });
  gm.action(room, m, "offer_bribe", { amount: 0 });
  gm.action(room, player, "inspect_bag");
  assert.equal(m.coins, 46);
  assert.equal(player.coins, 54);
  assert.equal(m.contraband.length, 0);
  assert.equal(room.discardPile.length, 1);
});
test("full game rotates every sheriff and produces a winner", () => {
  const { gm, room } = table();
  const sheriffs = new Set<string>();
  let turns = 0;
  while (room.status === "playing") {
    sheriffs.add(room.currentSheriffId);
    const m = room.players.find((p) => p.id === room.currentMerchantId)!;
    const s = room.players.find((p) => p.id === room.currentSheriffId)!;
    if (room.phase === "DRAW") gm.action(room, m, "draw_cards", { ids: [] });
    gm.action(room, m, "seal_bag", { ids: [m.hand[0].id] });
    gm.action(room, m, "declare_goods", { good: "Apple", quantity: 1 });
    gm.action(room, m, "offer_bribe", { amount: 5 });
    gm.action(room, s, "accept_bribe");
    gm.advance(room);
    turns++;
    assert.ok(turns < 10);
  }
  assert.equal(turns, 6);
  assert.equal(sheriffs.size, 3);
  assert.equal(room.phase, "GAME_OVER");
  assert.ok(room.winner);
  assert.equal(
    room.players.reduce((a, p) => a + p.coins, 0),
    150,
  );
});
test("rejoin requires secret token and host transfers on disconnect", () => {
  const { gm, room, player } = table();
  const token = player.token;
  gm.leave("s1");
  assert.equal(room.players[1].isHost, true);
  assert.throws(() =>
    gm.rejoin("fake", { roomId: room.id, playerId: player.id, token: "wrong" }),
  );
  gm.rejoin("new", { roomId: room.id, playerId: player.id, token });
  assert.equal(player.socketId, "new");
  assert.equal(player.isConnected, true);
});
