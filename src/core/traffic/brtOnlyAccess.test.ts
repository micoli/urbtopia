import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from './walking';
import { parseEnvelope, serializeEnvelope } from '../../persistence/envelope';
import { GOODS, SHOP, advance, congestionStats, createBuilding, newGame, transportStats, type GameState, type TransitTile } from '../index';

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
    transitLines: withLine ? [{ id: 30, mode: 'brt', stops: [1, 2], peakHeadway: 5, offPeakHeadway: 12 }] : [],
    transitFleet: withLine ? [{ id: 31, kind: 'brtElectric', purchasePrice: 900, lineId: 30 }] : [],
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

describe('workplaces reached only by a BRT corridor', () => {
  const withBuildings = (state: GameState, replace: (b: GameState['buildings'][number]) => GameState['buildings'][number]): GameState => ({ ...state, buildings: state.buildings.map(replace) });
  const swapWorkshop = (type: 'hospital' | 'shop') => (state: GameState) => withBuildings(state, (b) => (b.id === 5 ? createBuilding(5, type, 18, 1, 0) : b));

  it('counts the Jobs of a covered BRT-only facility, and not those of an uncovered one', () => {
    const covered = swapWorkshop('hospital')(brtDistrict());
    const uncovered = swapWorkshop('hospital')(brtDistrict({ withLine: false }));
    expect(congestionStats(covered).jobs).toBeGreaterThan(0);
    expect(congestionStats(uncovered).jobs).toBe(0);
  });

  it('never sends Commuters by car to a BRT-only workplace', () => {
    const stats = congestionStats(swapWorkshop('hospital')(brtDistrict({ roads: true })));
    expect(stats.commuters).toBe(0);
    expect(stats.homes.get(4)!.unemployed).toBe(0);
  });

  it('makes a covered BRT-only facility a destination for Riders', () => {
    const state = swapWorkshop('hospital')(brtDistrict());
    expect(transportStats(state).riders).toBeGreaterThan(0);
    expect(transportStats(state).coveredActivities.has(5)).toBe(true);
  });

  it('keeps the destinations of ordinary facilities unchanged', () => {
    const roadFacility = withBuildings(brtDistrict(), (b) => (b.id === 5 ? createBuilding(5, 'hospital', 18, 1, 0) : b));
    const noBrt = { ...roadFacility, brtRoads: [], transitLines: [], transitFleet: [] };
    expect(transportStats(noBrt).coveredActivities.size).toBe(0);
  });
});

describe('Shop reached only by a BRT corridor', () => {
  const good = Object.keys(GOODS)[0] as keyof typeof GOODS;
  const withShop = (state: GameState): GameState => ({
    ...state,
    buildings: state.buildings.map((b) =>
      b.id === 5 ? { ...createBuilding(5, 'shop', 18, 1, 0), stacks: [{ good, stock: SHOP.stackSize, nextSaleAt: 10_000, earned: 0 }] } : b,
    ),
    lastSeen: 0,
  });
  const stockAfter = (state: GameState, ms: number) => advance(state, ms).state.buildings.find((b) => b.id === 5)!.stacks[0]!;

  it('sells to Citizens covered by a station', () => {
    expect(stockAfter(withShop(brtDistrict()), 3_600_000).stock).toBeLessThan(SHOP.stackSize);
  });

  it('does not sell without a station in reach, and keeps its stock', () => {
    const stack = stockAfter(withShop(brtDistrict({ withLine: false })), 3_600_000);
    expect(stack.stock).toBe(SHOP.stackSize);
    expect(stack.earned).toBe(0);
  });

  it('resumes selling once a station covers it', () => {
    const stalled = advance(withShop(brtDistrict({ withLine: false })), 3_600_000).state;
    const served = { ...brtDistrict(), buildings: stalled.buildings, lastSeen: stalled.lastSeen };
    expect(advance(served, stalled.lastSeen + 3_600_000).state.buildings.find((b) => b.id === 5)!.stacks[0]!.stock).toBeLessThan(SHOP.stackSize);
  });
});

describe('saved cities', () => {
  it('keep their shape: access modes live in the data, not in the save', () => {
    const state = brtDistrict();
    const text = serializeEnvelope(state, 0);
    expect(text).not.toContain('accessModes');
    const loaded = parseEnvelope(text);
    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(congestionStats(loaded.state).homes.get(4)).toEqual(congestionStats(state).homes.get(4));
  });
});
