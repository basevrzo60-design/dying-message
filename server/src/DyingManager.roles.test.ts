import { test } from "node:test";
import assert from "node:assert/strict";
import { castFor, evidence } from "../../shared/dying.js";
import { DyingManager } from "./DyingManager.js";

test("ชุดตัวละครเพิ่มตามจำนวนผู้เล่นอย่างสมดุล", () => {
  assert.deepEqual(castFor(4), ["murderer", "detective", "innocent", "innocent"]);
  assert.ok(castFor(5).includes("celebrity"));
  assert.ok(castFor(6).includes("noble"));
  assert.ok(castFor(7).includes("guard"));
  assert.equal(castFor(8).filter(role => role === "professional").length, 1);
  assert.equal(castFor(8).includes("murderer"), false);
  for (let count = 4; count <= 8; count++) {
    const cast = castFor(count);
    assert.equal(cast.length, count);
    assert.equal(cast.filter(role => role === "murderer" || role === "professional").length, 1);
  }
});

test("คลังมี 90 ใบและแต่ละรอบสุ่มขึ้นโต๊ะ 9 ใบไม่ซ้ำกัน", () => {
  assert.equal(evidence.length, 90);
  assert.equal(new Set(evidence.map(card => card.id)).size, 90);
  const gm = new DyingManager(() => 0);
  const { room } = gm.create("c0", { playerName: "P0", roomName: "Cards", capacity: 4 });
  for (let i = 1; i < 4; i++) gm.join(`c${i}`, { playerName: `P${i}`, code: room.code });
  for (let i = 0; i < 4; i++) gm.action(`c${i}`, "ready");
  gm.action("c0", "start");
  for (let i = 0; i < 4; i++) gm.action(`c${i}`, "confirm");
  assert.equal(room.choices.length, 9);
  assert.equal(new Set(room.choices.map(card => card.id)).size, 9);
});

test("ความสามารถตัวละครถูกตรวจบนเซิร์ฟเวอร์", () => {
  const gm = new DyingManager(() => 0);
  const { room } = gm.create("s0", { playerName: "P0", roomName: "Roles", capacity: 8 });
  for (let i = 1; i < 8; i++) gm.join(`s${i}`, { playerName: `P${i}`, code: room.code });
  for (let i = 0; i < 8; i++) gm.action(`s${i}`, "ready");
  gm.action("s0", "start");
  const roles = new Map(room.players.map((player, index) => [player.role, index]));
  assert.ok(roles.has("professional") && roles.has("detective") && roles.has("celebrity") && roles.has("noble") && roles.has("guard"));
  for (let i = 0; i < 8; i++) gm.action(`s${i}`, "confirm");
  assert.equal(room.phase, "guard");
  const guard = roles.get("guard")!, professional = roles.get("professional")!, celebrity = roles.get("celebrity")!, detective = roles.get("detective")!;
  const protectedIndex = room.players.findIndex((_, index) => index !== guard && index !== professional && index !== celebrity);
  gm.action(`s${guard}`, "protect", { targetId: room.players[protectedIndex].id });
  assert.equal(gm.snapshot(room, room.players[guard]).me.protectedId, room.players[protectedIndex].id);
  assert.equal(gm.snapshot(room, room.players[professional]).me.protectedId, null);
  assert.throws(() => gm.action(`s${professional}`, "kill", { targetId: room.players[protectedIndex].id }), /ปกป้อง/);
  gm.action(`s${professional}`, "kill", { targetId: room.players[celebrity].id });
  assert.equal(gm.snapshot(room, room.players[professional]).fakeClueCount, 2, "ผู้มีชื่อเสียงลดภาพลวงของมืออาชีพจาก 3 เหลือ 2");
  const real = room.choices[0].id;
  gm.action(`s${celebrity}`, "real_clue", { clueIds: [real] });
  assert.equal(room.phase, "detective");
  assert.deepEqual(gm.snapshot(room, room.players[detective]).me.realClueIds, [real]);
  assert.deepEqual(gm.snapshot(room, room.players[guard]).me.realClueIds, []);
});

test("ขุนนางต้องทิ้งเบาะแสจริงสองใบ", () => {
  const gm = new DyingManager(() => 0);
  const { room } = gm.create("s0", { playerName: "P0", roomName: "Noble", capacity: 6 });
  for (let i = 1; i < 6; i++) gm.join(`s${i}`, { playerName: `P${i}`, code: room.code });
  for (let i = 0; i < 6; i++) gm.action(`s${i}`, "ready");
  gm.action("s0", "start");
  for (let i = 0; i < 6; i++) gm.action(`s${i}`, "confirm");
  const killer = room.players.findIndex(p => p.role === "murderer"), noble = room.players.findIndex(p => p.role === "noble");
  gm.action(`s${killer}`, "kill", { targetId: room.players[noble].id });
  assert.equal(gm.snapshot(room, room.players[noble]).realClueCount, 2);
  assert.throws(() => gm.action(`s${noble}`, "real_clue", { clueIds: [room.choices[0].id] }), /2 ใบ/);
  gm.action(`s${noble}`, "real_clue", { clueIds: room.choices.slice(0, 2).map(card => card.id) });
  assert.equal(room.realIds.length, 2);
});
