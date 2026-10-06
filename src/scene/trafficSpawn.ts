import { tileKey, type Coord } from '../core';

export const SPAWN = {
  floor: 1,
  saturatedBonus: 4,
};

export function spawnWeight(ratio: number): number {
  return SPAWN.floor + SPAWN.saturatedBonus * Math.min(1, Math.max(0, ratio - 1));
}

export function cumulativeWeights(tiles: readonly Coord[], ratioOf: (key: string) => number): number[] {
  let total = 0;
  return tiles.map((tile) => (total += spawnWeight(ratioOf(tileKey(tile)))));
}

export function pickByWeight(cumulative: readonly number[], random: number): number {
  const total = cumulative.at(-1) ?? 0;
  if (total <= 0) return 0;
  const target = random * total;
  const index = cumulative.findIndex((sum) => sum > target);
  return index < 0 ? cumulative.length - 1 : index;
}
