import type { BasketballState, MatchState } from '../../core';

export type Jerseys = ReadonlyMap<number, number>;

// A shirt number belongs to the player for the whole Match: the starters wear 1 to 11 in the order of the lineup, the bench the numbers after them.
export function footballJerseys(start: MatchState): Jerseys {
  const [mine] = start.sides;
  return new Map([...mine.pitch, ...mine.bench].map((player, index) => [player.id, index + 1]));
}

// Basketball shirts start at 4, as in international play: the starters first, then the bench.
export function basketballJerseys(start: BasketballState): Jerseys {
  const [mine] = start.sides;
  return new Map([...mine.court, ...mine.bench].map((player, index) => [player.id, index + 4]));
}
