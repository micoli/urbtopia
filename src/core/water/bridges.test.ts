import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { congestionStats, createBuilding, dispatch, newGame, roadExits, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

function succeed(state: GameState, command: Command): GameState {
  const result = dispatch(state, command, T0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
}

const row = (from: number, to: number, y = 50) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y }));
const bridge = (x: number, length: number, y = 50, axis: 'x' | 'y' = 'x'): Command => ({ type: 'PlaceBridge', x, y, length, axis });

function river(overrides: Partial<GameState> = {}): GameState {
  const base = newGame({ seed: 'bridges', now: T0 });
  return {
    ...base, urbs: 100_000, tutorial: null, adaptationUntil: 0, nextId: 300,
    roads: [...row(48, 51), ...row(55, 60)].map((tile) => ({ ...tile, kind: 'road' as const })),
    buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 6 }],
    waterTiles: row(52, 54),
    ...overrides,
  };
}

describe('Placing a Bridge', () => {
  it.each([[1, 150], [2, 300], [3, 450], [5, 800]])('a %i-tile Bridge costs %i Urbs', (length, price) => {
    const state = river({ waterTiles: row(52, 52 + length - 1), roads: [...row(48, 51), ...row(52 + length, 58)].map((tile) => ({ ...tile, kind: 'road' as const })) });
    expect(succeed(state, bridge(52, length)).urbs).toBe(100_000 - price);
  });

  it('unlocks at 120 Citizens', () => {
    const small = river({ buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 5 }] });
    expect(failureKey(small, bridge(52, 3))).toBe('error.itemLocked');
  });

  it('crosses Water tiles only', () => {
    expect(failureKey(river(), bridge(52, 5))).toBe('error.bridgeNeedsWater');
    expect(failureKey(river({ waterTiles: row(52, 53) }), bridge(52, 3))).toBe('error.bridgeNeedsWater');
  });

  it('needs a Road at each end, aligned with it', () => {
    expect(failureKey(river({ roads: row(48, 51).map((tile) => ({ ...tile, kind: 'road' as const })) }), bridge(52, 3))).toBe('error.bridgeNeedsRoad');
    expect(failureKey(river(), bridge(52, 2))).toBe('error.bridgeNeedsRoad');
    expect(failureKey(river(), bridge(52, 3))).toBeNull();
  });

  it('works vertically too', () => {
    const state = river({ waterTiles: [{ x: 60, y: 50 }, { x: 60, y: 51 }], roads: [{ x: 60, y: 49, kind: 'road' }, { x: 60, y: 52, kind: 'road' }] });
    expect(failureKey(state, bridge(60, 2, 50, 'y'))).toBeNull();
    expect(failureKey(state, bridge(60, 2, 50, 'x'))).toBe('error.bridgeNeedsWater');
  });

  it('cannot overlap another Bridge or sit on a Boat', () => {
    const placed = succeed(river(), bridge(52, 3));
    expect(failureKey(placed, bridge(53, 1))).toBe('error.tilesOccupied');
    const boated = river({ buildings: [...river().buildings, createBuilding(100, 'marina', 52, 48, 0)], boats: [{ id: 200, family: 'pleasure', marinaId: 100, x: 53, y: 50 }], nextId: 300 });
    expect(failureKey(boated, bridge(52, 3))).toBe('error.tilesOccupied');
  });

  it('needs enough Urbs', () => {
    expect(failureKey(river({ urbs: 449 }), bridge(52, 3))).toBe('error.notEnoughUrbs');
  });
});

describe('A Bridge in the Road graph', () => {
  it('joins the Roads of both banks', () => {
    const placed = succeed(river(), bridge(52, 3));
    expect(roadExits(placed, { x: 52, y: 50 })).toEqual(expect.arrayContaining(['E', 'W']));
    expect(placed.roads.filter((road) => road.x >= 52 && road.x <= 54)).toHaveLength(3);
  });

  it('lets a Home reach a workplace across the water', () => {
    const supplied = river({ buildings: [...river().buildings, { ...createBuilding(2, 'waterTower', 58, 56, 0), tier: 3 }] });
    const town = succeed(succeed(supplied, { type: 'PlaceBuilding', buildingType: 'home', x: 49, y: 49 }), { type: 'PlaceBuilding', buildingType: 'workshop', x: 56, y: 48 });
    const homeId = town.buildings.find((building) => building.id !== 1 && building.type === 'home')!.id;
    expect(congestionStats(town).homes.get(homeId)?.disconnected).toBe(true);
    const crossed = succeed(town, bridge(52, 3));
    expect(congestionStats(crossed).homes.get(homeId)?.disconnected).toBe(false);
  });
});

describe('Under a Bridge', () => {
  it('keeps the Water tiles, which cannot be removed', () => {
    const placed = succeed(river(), bridge(52, 3));
    expect(placed.waterTiles).toEqual(row(52, 54));
    expect(failureKey(placed, { type: 'RemoveWater', tiles: [{ x: 53, y: 50 }] })).toBe('error.waterInUse');
  });

  it('lets Boats be bought only beside the Bridge', () => {
    const wide = river({ waterTiles: [...row(52, 54), ...row(52, 54, 51)], buildings: [...river().buildings, createBuilding(100, 'marina', 52, 52, 0)] });
    const placed = succeed(wide, bridge(52, 3));
    expect(failureKey(placed, { type: 'BuyBoat', family: 'pleasure', marinaId: 100, x: 53, y: 50 })).toBe('error.tilesOccupied');
    expect(failureKey(placed, { type: 'BuyBoat', family: 'pleasure', marinaId: 100, x: 53, y: 51 })).toBeNull();
  });
});

describe('Removing a Bridge', () => {
  it('refunds part of its price and removes its Road tiles', () => {
    const placed = succeed(river(), bridge(52, 3));
    const removed = succeed(placed, { type: 'RemoveBridge', x: 53, y: 50 });
    expect(removed.bridges).toEqual([]);
    expect(removed.roads).toEqual(river().roads);
    expect(removed.urbs).toBe(placed.urbs + 337);
    expect(failureKey(removed, { type: 'RemoveBridge', x: 53, y: 50 })).toBe('error.noBridgeHere');
  });

  it('is the only way to take down a Bridge Road tile', () => {
    const placed = succeed(river(), bridge(52, 3));
    expect(failureKey(placed, { type: 'DemolishRoad', x: 53, y: 50 })).toBe('error.bridgeTile');
    expect(failureKey(placed, { type: 'DemolishRoad', x: 49, y: 50 })).toBeNull();
  });
});
