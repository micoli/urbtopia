import type { MatchState } from '../../core';

export type Jerseys = ReadonlyMap<number, number>;

// A shirt number belongs to the player for the whole Match: the starters wear 1 to 11 in the order of the lineup, the bench the numbers after them.
export function footballJerseys(start: MatchState): Jerseys {
  const [mine] = start.sides;
  return new Map([...mine.pitch, ...mine.bench].map((player, index) => [player.id, index + 1]));
}
