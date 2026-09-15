export type Player = { id: number; name: string; thief: boolean; hour: number };
function randomInt(max: number) {
  const values = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= limit);
  return values[0] % max;
}
export function deal(names: string[]): Player[] {
  if (names.length < 4 || names.length > 8)
    throw new Error("ต้องมีผู้เล่น 4–8 คน");
  const thief = randomInt(names.length);
  return names.map((name, id) => ({
    id,
    name,
    thief: id === thief,
    hour: randomInt(6) + 1,
  }));
}
export function tally(players: Player[], votes: number[]) {
  if (
    votes.length !== players.length ||
    votes.some((v) => !players.some((p) => p.id === v))
  )
    throw new Error("คะแนนไม่ครบหรือไม่ถูกต้อง");
  const counts = Object.fromEntries(
    players.map((p) => [p.id, votes.filter((v) => v === p.id).length]),
  );
  const max = Math.max(...Object.values(counts));
  const leaders = players.filter((p) => counts[p.id] === max);
  return {
    counts,
    tied: leaders.length !== 1,
    accused: leaders.length === 1 ? leaders[0].id : null,
    caught: leaders.length === 1 && leaders[0].thief,
  };
}
