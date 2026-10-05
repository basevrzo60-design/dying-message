import { test } from "node:test";
import assert from "node:assert/strict";
import { deal, tally } from "./cheese";
test("4–8 players always receive one thief and valid independent wake times", () => {
  for (let n = 4; n <= 8; n++)
    for (let round = 0; round < 50; round++) {
      const players = deal(Array.from({ length: n }, (_, i) => `หนู ${i}`));
      assert.equal(players.length, n);
      assert.equal(players.filter((p) => p.thief).length, 1);
      assert.ok(
        players.every(
          (p) => Number.isInteger(p.hour) && p.hour >= 1 && p.hour <= 6,
        ),
      );
      assert.equal(new Set(players.map((p) => p.id)).size, n);
    }
  assert.throws(() => deal(["a", "b", "c"]));
  assert.throws(() => deal(Array(9).fill("a")));
});
const players = ["a", "b", "c", "d"].map((name, id) => ({
  name,
  id,
  thief: id === 1,
  hour: id + 1,
}));
test("correct accusation wins, wrong accusation and ties lose", () => {
  assert.equal(tally(players, [1, 1, 1, 0]).caught, true);
  assert.equal(tally(players, [0, 0, 0, 1]).caught, false);
  assert.equal(tally(players, [0, 0, 1, 1]).tied, true);
  assert.equal(tally(players, [0, 0, 1, 1]).caught, false);
  assert.equal(tally(players, [0, 1, 2, 3]).accused, null);
});
test("results require one valid vote per player", () => {
  assert.throws(() => tally(players, [1, 1, 1]));
  assert.throws(() => tally(players, [1, 1, 1, 9]));
});
