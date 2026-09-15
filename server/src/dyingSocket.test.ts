import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as connect, type Socket } from "socket.io-client";
import { attachDying } from "./dyingSocket.js";
import type { View } from "../../shared/dying.js";

test("Dying Message keeps clues private and completes a multi-round game", { timeout: 20000 }, async () => {
  const http = createServer(), io = new Server(http);
  attachDying(io);
  await new Promise<void>(resolve => http.listen(0, "127.0.0.1", resolve));
  const port = (http.address() as { port: number }).port;
  const clients: Socket[] = [], views: (View | null)[] = [];
  const act = (i: number, event: string, data: object = {}) => new Promise<any>((resolve, reject) => clients[i].timeout(4000).emit("action", { event, data }, (err: Error | null, result: any) => err ? reject(err) : resolve(result)));
  const until = async (predicate: () => boolean) => { const end = Date.now() + 4000; while (!predicate()) { if (Date.now() > end) throw Error("state timeout"); await new Promise(r => setTimeout(r, 10)); } };
  try {
    for (let i = 0; i < 4; i++) { const socket = connect(`http://127.0.0.1:${port}/dying`, { forceNew: true, reconnection: false }); clients.push(socket); socket.on("state", state => views[i] = state); await new Promise<void>(resolve => socket.once("connect", resolve)); }
    const created = await act(0, "create", { playerName: "A", roomName: "Case", capacity: 4 });
    assert.equal(created.ok, true);
    const code = created.session.code;
    for (let i = 1; i < 4; i++) assert.equal((await act(i, "join", { playerName: `P${i}`, code })).ok, true);
    for (let i = 0; i < 4; i++) await act(i, "ready");
    await act(0, "start"); await until(() => views.every(v => v?.phase === "reveal"));
    const killer = views.findIndex(v => v?.me.role === "murderer");
    assert.ok(killer >= 0);
    for (let i = 0; i < 4; i++) { assert.equal(views[i]!.players.some(p => "role" in p || "token" in p), false); assert.equal(views[i]!.murdererId, null); assert.equal(views[i]!.clueChoices.length, 0); }
    for (let i = 0; i < 4; i++) await act(i, "confirm");
    await until(() => views.every(v => v?.phase === "kill"));
    const firstVictim = (killer + 1) % 4;
    assert.equal((await act(firstVictim, "kill", { targetId: views[killer]!.me.id })).ok, false);
    await act(killer, "kill", { targetId: views[firstVictim]!.me.id });
    await until(() => views.every(v => v?.phase === "real_clue"));
    assert.equal(views[firstVictim]!.me.secretMurdererId, views[killer]!.me.id);
    for (let i = 0; i < 4; i++) if (i !== firstVictim) { assert.equal(views[i]!.clueChoices.length, 0); if (i !== killer) assert.equal(views[i]!.me.secretMurdererId, null); }
    const real = views[firstVictim]!.clueChoices[3].id;
    await act(firstVictim, "real_clue", { clueId: real }); await until(() => views.every(v => v?.phase === "detective" || v?.phase === "fake_clues"));
    if (views[0]!.phase === "detective") {
      const detective = views.findIndex(v => v?.me.role === "detective");
      assert.deepEqual(views[detective]!.me.realClueIds, [real]);
      for (let i = 0; i < 4; i++) if (i !== detective) assert.deepEqual(views[i]!.me.realClueIds, []);
      await act(detective, "ack_detective"); await until(() => views.every(v => v?.phase === "fake_clues"));
    }
    assert.deepEqual(views[killer]!.me.realClueIds, [real]);
    assert.deepEqual(views[(killer + 2) % 4]!.me.realClueIds, []);
    const fake = views[killer]!.clueChoices.filter(c => c.id !== real).slice(0, 2).map(c => c.id);
    assert.equal((await act(killer, "fake_clues", { clueIds: [real, fake[0]] })).ok, false);
    await act(killer, "fake_clues", { clueIds: fake }); await until(() => views.every(v => v?.phase === "discussion"));
    for (const v of views) { assert.equal(v!.revealedClues.length, 3); assert.deepEqual(new Set(v!.revealedClues.map(c => c.id)), new Set([real, ...fake])); assert.deepEqual(v!.me.realClueIds, []); }
    await act(0, "open_vote"); await until(() => views.every(v => v?.phase === "vote"));
    const other = [0,1,2,3].find(i => i !== killer && i !== firstVictim)!;
    for (let i = 0; i < 4; i++) if (i !== firstVictim) await act(i, "vote", { targetId: views[other]!.me.id });
    await until(() => views.every(v => v?.phase === "round_end"));
    assert.equal(views[other]!.me.alive, false);
    assert.equal((await act(firstVictim, "vote", { targetId: views[killer]!.me.id })).ok, false);
    await act(0, "next_round"); await until(() => views.every(v => v?.phase === "kill"));
    const finalVictim = [0,1,2,3].find(i => i !== killer && i !== firstVictim && i !== other)!;
    await act(killer, "kill", { targetId: views[finalVictim]!.me.id });
    await until(() => views.every(v => v?.phase === "result"));
    assert.equal(views[0]!.winner, "murderer");
    assert.equal(views[0]!.murdererId, views[killer]!.me.id);
    clients[0].disconnect(); await until(() => !views[1]!.players[0].connected);
    clients[0].connect(); await new Promise<void>(resolve => clients[0].once("connect", resolve));
    assert.equal((await act(0, "rejoin", created.session)).ok, true);
    await until(() => views[0]?.players[0].connected === true && views[0]?.hostId === views[1]?.hostId);
    const host = views.findIndex(v => v?.me.id === views[1]?.hostId);
    const restarted = await act(host, "restart"); assert.equal(restarted.ok, true, restarted.error); await until(() => views.every(v => v?.phase === "lobby"));
    for (let i = 0; i < 4; i++) await act(i, "ready");
    await act(host, "start"); await until(() => views.every(v => v?.phase === "reveal"));
    const newKiller = views.findIndex(v => v?.me.role === "murderer");
    for (let i = 0; i < 4; i++) await act(i, "confirm");
    await until(() => views.every(v => v?.phase === "kill"));
    const newVictim = (newKiller + 1) % 4;
    await act(newKiller, "kill", { targetId: views[newVictim]!.me.id });
    await until(() => views.every(v => v?.phase === "real_clue"));
    await act(newVictim, "real_clue", { clueId: views[newVictim]!.clueChoices[0].id });
    await until(() => views.every(v => v?.phase === "detective" || v?.phase === "fake_clues"));
    if (views[0]!.phase === "detective") { const detective = views.findIndex(v => v?.me.role === "detective"); await act(detective, "ack_detective"); await until(() => views.every(v => v?.phase === "fake_clues")); }
    await act(newKiller, "fake_clues", { clueIds: views[newKiller]!.clueChoices.filter(c => !views[newKiller]!.me.realClueIds.includes(c.id)).slice(0, 2).map(c => c.id) });
    await until(() => views.every(v => v?.phase === "discussion"));
    await act(host, "open_vote"); await until(() => views.every(v => v?.phase === "vote"));
    for (let i = 0; i < 4; i++) if (i !== newVictim) await act(i, "vote", { targetId: views[newKiller]!.me.id });
    await until(() => views.every(v => v?.phase === "result"));
    assert.equal(views[0]!.winner, "innocents");
  } finally { clients.forEach(c => c.disconnect()); await new Promise<void>(resolve => io.close(() => resolve())); }
});
