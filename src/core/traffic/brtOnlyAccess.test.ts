import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from './walking';
import { congestionStats, createBuilding, newGame, type GameState, type TransitTile } from '../index';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = true;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const strip = (x: number, y: number, length: number): TransitTile[] =>
  Array.from({ length }, (_, i) => ({ x: x + i, y, exits: i === 0 ? ['E'] : i === length - 1 ? ['W'] : ['W', 'E'] }));

function brtDistrict({ withLine = true, roads = false } = {}): GameState {
  return {
    ...newGame({ seed: 'brt-only', now: 0 }),
    ownedParcels: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    urbs: 100_000,
    nextId: 100,
    adaptationUntil: 0,
    buildings: [
      createBuilding(1, 'brtStation', 0, 1, 0),
      createBuilding(2, 'brtStation', 20, 1, 0),
      createBuilding(3, 'powerPlant', 5, 5, 0),
      { ...createBuilding(4, 'home', 2, 1, 0), tier: 3 },
      createBuilding(5, 'workshop', 18, 1, 0),
    ],
    roads: roads ? strip(30, 0, 5).map(({ x, y }) => ({ x, y, kind: 'road' as const })) : [],
    roundabouts: [],
    brtRoads: strip(0, 0, 21),
    transitLines: withLine ? [{ id: 3, mode: 'brt', stops: [1, 2], peakHeadway: 5, offPeakHeadway: 12 }] : [],
    transitFleet: withLine ? [{ id: 4, kind: 'brtElectric', purchasePrice: 900, lineId: 3 }] : [],
  };
}

describe('Home reached only by a BRT corridor', () => {
  it('has no Commute by car and no Pedestrian path when a station covers it', () => {
    const stats = congestionStats(brtDistrict());
    const home = stats.homes.get(4)!;
    expect(home).toMatchObject({ commuters: 0, walkers: 0, walkAccess: 0, ratio: 0, disconnected: false });
    expect(stats.commuters).toBe(0);
    expect(stats.walkers).toBe(0);
    expect(stats.modes.transit).toBeGreaterThan(0);
    expect(stats.disconnectedSections).toEqual([]);
  });

  it('is marked disconnected with maximum Congestion when no station covers it', () => {
    const stats = congestionStats(brtDistrict({ withLine: false }));
    expect(stats.homes.get(4)).toMatchObject({ commuters: 0, disconnected: true });
    expect(stats.homes.get(4)!.ratio).toBeGreaterThan(1);
    expect(stats.disconnectedSections).toHaveLength(1);
    expect(stats.disconnectedSections[0]).toContainEqual({ x: 2, y: 1 });
    expect(stats.index).toBeGreaterThan(1);
  });

  it('is still marked disconnected when roads exist elsewhere in the city', () => {
    const stats = congestionStats(brtDistrict({ withLine: false, roads: true }));
    expect(stats.homes.get(4)!.disconnected).toBe(true);
    expect(stats.disconnectedSections.some((section) => section.some((tile) => tile.x === 2 && tile.y === 1))).toBe(true);
  });

  it('is deterministic across calls', () => {
    const state = brtDistrict();
    expect(congestionStats(state, 1000).homes.get(4)).toEqual(congestionStats(state, 1000).homes.get(4));
  });
});
