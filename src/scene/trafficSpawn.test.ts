import { describe, expect, it } from 'vitest';
import { SPAWN, cumulativeWeights, pickByWeight, spawnWeight } from './trafficSpawn';

describe('spawnWeight', () => {
  it('keeps the floor weight on roads that are not saturated', () => {
    expect(spawnWeight(0)).toBe(SPAWN.floor);
    expect(spawnWeight(1)).toBe(SPAWN.floor);
  });

  it('grows with the saturation and stops at the maximum ratio', () => {
    expect(spawnWeight(1.5)).toBeGreaterThan(spawnWeight(1.2));
    expect(spawnWeight(2)).toBe(SPAWN.floor + SPAWN.saturatedBonus);
    expect(spawnWeight(5)).toBe(spawnWeight(2));
  });
});

describe('picking a spawn tile', () => {
  const tiles = [0, 1, 2].map((x) => ({ x, y: 0 }));
  const cumulative = cumulativeWeights(tiles, (key) => (key === '1,0' ? 2 : 0));

  it('builds running totals from the congestion of each tile', () => {
    expect(cumulative).toEqual([1, 1 + 5, 1 + 5 + 1]);
  });

  it('picks the saturated tile most of the time and still reaches quiet ones', () => {
    const picks = Array.from({ length: 700 }, (_, step) => pickByWeight(cumulative, (step + 0.5) / 700));
    const count = (index: number) => picks.filter((pick) => pick === index).length;
    expect(count(1)).toBeGreaterThan(count(0) * 4);
    expect(count(0)).toBeGreaterThan(0);
    expect(count(2)).toBeGreaterThan(0);
  });

  it('is deterministic and always inside the list', () => {
    expect(pickByWeight(cumulative, 0)).toBe(0);
    expect(pickByWeight(cumulative, 0.999999)).toBe(2);
    expect(pickByWeight([], 0.5)).toBe(0);
  });
});
