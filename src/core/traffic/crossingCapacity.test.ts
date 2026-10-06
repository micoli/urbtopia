import { afterEach, describe, expect, it } from 'vitest';
import { congestionStats, createBuilding, laneCapacity, newGame, type Building, type GameState } from '../index';
import { WALKING, crossingCut } from './walking';

const base = newGame({ seed: 'crossing-capacity', now: 0 });
const defaultWork = WALKING.workThreshold;
const defaultShop = WALKING.thresholds.shop;
const CROSSING = '57,58';

function city(crossing: boolean, homes: { x: number; tier: number }[] = [{ x: 56, tier: 3 }, { x: 59, tier: 3 }]): GameState {
  let nextId = base.nextId;
  const added: Building[] = [
    { ...createBuilding(nextId++, 'shop', 57, 57, 0), tier: 1 },
    ...homes.map((home) => ({ ...createBuilding(nextId++, 'home', home.x, 59, 0), tier: home.tier })),
  ];
  const roads = base.roads.map((road) => (crossing && road.x === 57 && road.y === 58 ? { ...road, kind: 'crossing' as const } : road));
  return { ...base, roads, nextId, buildings: [...base.buildings, ...added] };
}

afterEach(() => {
  WALKING.workThreshold = defaultWork;
  WALKING.thresholds.shop = defaultShop;
  WALKING.enabled = true;
});

describe('Crossing capacity', () => {
  it('cuts the capacity of a road tile by its pedestrian load', () => {
    WALKING.workThreshold = 0;
    const plain = congestionStats(city(false)).sections.get(CROSSING)!;
    const stats = congestionStats(city(true));
    const section = stats.sections.get(CROSSING)!;
    const pedestrians = stats.pedestrians.get(CROSSING)!;
    expect(pedestrians).toBeGreaterThan(0);
    expect(plain.capacity).toBe(laneCapacity(1));
    expect(section.capacity).toBeCloseTo(laneCapacity(1) * (1 - crossingCut(pedestrians)));
    expect(section.capacity).toBeLessThan(plain.capacity);
    expect(section.ratio).toBeGreaterThan(plain.ratio);
  });

  it('never cuts more than the maximum', () => {
    WALKING.workThreshold = 0;
    const stats = congestionStats(city(true, [{ x: 56, tier: 3 }, { x: 59, tier: 3 }, { x: 61, tier: 3 }]));
    expect(stats.sections.get(CROSSING)!.capacity).toBeCloseTo(laneCapacity(1) * (1 - WALKING.maxCrossingCut));
    expect(stats.crossings.get(CROSSING)).toMatchObject({ saturated: true, cut: WALKING.maxCrossingCut });
    expect(stats.saturatedCrossings).toBe(1);
  });

  it('costs nothing when nobody uses the Crossing', () => {
    WALKING.workThreshold = 0;
    WALKING.thresholds.shop = 0;
    const plain = congestionStats(city(false)).sections.get(CROSSING)!;
    const stats = congestionStats(city(true));
    expect(stats.crossings.size).toBe(0);
    expect(stats.sections.get(CROSSING)!.capacity).toBe(plain.capacity);
    expect(stats.saturatedCrossings).toBe(0);
  });

  it('lets the player see the trade-off: more pedestrians, fewer cars on the road', () => {
    WALKING.workThreshold = 5;
    const without = congestionStats(city(false));
    const crossed = congestionStats(city(true));
    expect(crossed.walkers).toBeGreaterThan(without.walkers);
    expect(crossed.commuters).toBeLessThan(without.commuters);
  });
});
