import { io } from "socket.io-client";
import assert from "node:assert/strict";
const clients = [];
const connect = () =>
  new Promise((resolve, reject) => {
    const s = io(process.env.TEST_SERVER_URL || "http://localhost:3000", {
      forceNew: true,
      reconnection: false,
    });
    clients.push(s);
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });
const emit = (s, event, data = {}) =>
  new Promise((resolve, reject) =>
    s
      .timeout(3000)
      .emit(event, data, (err, r) =>
        err ? reject(err) : r.ok ? resolve(r) : reject(Error(r.error)),
      ),
  );
const snapshots = new Map();
try {
  const a = await connect(),
    b = await connect(),
    c = await connect();
  for (const s of clients) s.on("game_state", (r) => snapshots.set(s.id, r));
  const session = await emit(a, "create_room", {
    playerName: "John",
    roomName: "Integration test",
    maxPlayers: 3,
  });
  await emit(b, "join_room", { roomId: session.roomId, playerName: "Mike" });
  await emit(c, "join_room", { roomId: session.roomId, playerName: "Anna" });
  for (const s of clients) await emit(s, "player_ready");
  await emit(a, "start_game");
  await new Promise((r) => setTimeout(r, 100));
  for (const s of clients) {
    const state = snapshots.get(s.id);
    assert.equal(state.room.status, "playing");
    assert.equal(state.room.players.length, 3);
    assert.equal(state.privatePlayer.hand.length, 8);
    assert.ok(
      state.room.players.every((p) => !("hand" in p) && !("token" in p)),
    );
  }
  const bState = snapshots.get(b.id);
  await emit(b, "draw_cards", { ids: [] });
  await emit(b, "seal_bag", { ids: [bState.privatePlayer.hand[0].id] });
  await emit(b, "declare_goods", { good: "Apple", quantity: 1 });
  await emit(b, "offer_bribe", { amount: 3 });
  await assert.rejects(() => emit(c, "inspect_bag"), /นายอำเภอ/);
  await emit(a, "accept_bribe");
  await emit(c, "send_message", { text: "Only apples!" });
  await new Promise((r) => setTimeout(r, 100));
  for (const s of clients) {
    const st = snapshots.get(s.id);
    assert.equal(st.room.phase, "INSPECTION_RESULT");
    assert.equal(st.room.players[0].coins, 53);
    assert.equal(st.room.players[1].coins, 47);
    assert.equal(st.room.messages.at(-1).text, "Only apples!");
  }
  a.disconnect();
  await new Promise((r) => setTimeout(r, 100));
  const fresh = await connect();
  fresh.on("game_state", (r) => snapshots.set(fresh.id, r));
  await emit(fresh, "rejoin_room", session);
  assert.equal(snapshots.get(fresh.id).playerId, session.playerId);
  console.log(
    "PASS: three real Socket.IO players, lobby sync, private hands, game start, bag/bribe resolution, authorization, chat, disconnect and rejoin.",
  );
} finally {
  clients.forEach((s) => s.disconnect());
}
