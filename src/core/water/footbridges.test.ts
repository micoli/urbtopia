import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { bridgeFootprint, bridgeTiles, createBuilding, dispatch, newGame, type Command, type GameState } from '../index';

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

const column = (x: number, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x, y: from + index }));
const row = (from: number, to: number, y = 50) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y }));
const footbridge = (x: number, length: number, side: 1 | -1 = 1, y = 50, axis: 'x' | 'y' = 'x'): Command => ({ type: 'PlaceBridge', x, y, length, axis, carrier: 'pedestrian', side });

// A Road along y at x=50. The deck of a Footbridge of the given length starts at x=50 and its corridors stand at x=49 and x=50+length, on y=51: the far one has a Pedestrian way beyond it when the span is longer than the Road.
function crossing(length = 1, overrides: Partial<GameState> = {}): GameState {
  const base = newGame({ seed: 'footbridge', now: T0 });
  return {
    ...base, urbs: 100_000, tutorial: null, adaptationUntil: 0, nextId: 300,
    roads: column(50, 45, 55).map((tile) => ({ ...tile, kind: 'road' as const })),
    pedestrianWays: length > 1 ? [{ x: 51 + length, y: 51 }] : [],
    buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 6 }],
    ...overrides,
  };
}

describe('The footprint of a Footbridge', () => {
  it.each([[1, 3], [2, 4], [3, 5], [5, 7]])('is 2 tiles wide and %i + 2 long for a span of %i', (length, long) => {
    const bridge = { x: 50, y: 50, length, axis: 'x' as const, carrier: 'pedestrian' as const, side: 1 as const };
    const footprint = bridgeFootprint(bridge);
    expect(footprint).toHaveLength(2 * long);
    expect(new Set(footprint.map((tile) => tile.x)).size).toBe(long);
    expect(new Set(footprint.map((tile) => tile.y))).toEqual(new Set([50, 51]));
    expect(bridgeTiles(bridge)).toHaveLength(2 * length);
  });

  it.each<[number, 'x' | 'y', 1 | -1]>([[50, 'x', 1], [50, 'x', -1], [50, 'y', 1], [50, 'y', -1]])('keeps the corridors on the same lane at both ends (%i %s %i)', (_x, axis, side) => {
    const bridge = { x: 50, y: 50, length: 3, axis, carrier: 'pedestrian' as const, side };
    const lanes = bridgeFootprint(bridge).map((tile) => (axis === 'x' ? tile.y : tile.x));
    expect(new Set(lanes)).toEqual(new Set([50, 50 + side]));
  });
});

describe('Placing a Footbridge', () => {
  it.each([[1, 180], [2, 270], [3, 360], [5, 570]])('a span of %i costs %i Urbs, corridors and stairs included', (length, price) => {
    expect(succeed(crossing(length), footbridge(50, length)).urbs).toBe(100_000 - price);
  });

  it('records the Carrier and the side, and adds no Road tile', () => {
    const state = crossing();
    const placed = succeed(state, footbridge(50, 1, -1));
    expect(placed.bridges).toEqual([{ x: 50, y: 50, length: 1, axis: 'x', carrier: 'pedestrian', side: -1 }]);
    expect(placed.roads).toEqual(state.roads);
  });

  it('works on the other axis', () => {
    const state = crossing(1, { roads: row(45, 55).map((tile) => ({ ...tile, kind: 'road' as const })) });
    expect(succeed(state, footbridge(50, 1, 1, 50, 'y')).bridges).toHaveLength(1);
  });

  it('unlocks at 120 Citizens', () => {
    const small = crossing(1, { buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 5 }] });
    expect(failureKey(small, footbridge(50, 1))).toBe('error.itemLocked');
  });

  it('needs enough Urbs', () => {
    expect(failureKey(crossing(1, { urbs: 179 }), footbridge(50, 1))).toBe('error.notEnoughUrbs');
  });

  it('refuses an unknown span or a missing side', () => {
    expect(failureKey(crossing(), footbridge(50, 4))).toBe('error.unknownCommand');
    expect(failureKey(crossing(), { type: 'PlaceBridge', x: 50, y: 50, length: 1, axis: 'x', carrier: 'pedestrian' })).toBe('error.unknownCommand');
  });

  it('needs infrastructure under the deck', () => {
    expect(failureKey(crossing(1, { roads: [] }), footbridge(50, 1))).toBe('error.bridgeNeedsInfrastructure');
  });

  it('crosses a Railway too', () => {
    const state = crossing(1, { roads: [], rails: column(50, 45, 55).map((tile) => ({ ...tile, exits: tile.y === 45 ? ['S' as const] : tile.y === 55 ? ['N' as const] : ['N' as const, 'S' as const] })), pedestrianWays: [{ x: 48, y: 51 }, { x: 52, y: 51 }] });
    expect(succeed(state, footbridge(50, 1)).bridges).toHaveLength(1);
  });

  it('needs a Sidewalk or a Pedestrian way at each corridor', () => {
    expect(failureKey(crossing(3, { pedestrianWays: [] }), footbridge(50, 3))).toBe('error.bridgeNeedsPath');
  });

  it('accepts a Pedestrian way next to a corridor instead of a Sidewalk', () => {
    expect(succeed(crossing(3), footbridge(50, 3)).bridges).toHaveLength(1);
  });

  it('only crosses infrastructure that runs across the deck', () => {
    const along = crossing(3, { roads: [...row(50, 52), ...column(50, 45, 55)].map((tile) => ({ ...tile, kind: 'road' as const })) });
    expect(failureKey(along, footbridge(50, 3))).toBe('error.bridgeCrossesAlong');
  });

  it.each<[string, Partial<GameState>]>([
    ['a building on a corridor', { buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 6 }, createBuilding(2, 'home', 49, 51, 0)] }],
    ['a Field on a stair', { fields: [{ x: 49, y: 50 }] }],
    ['a Pedestrian way beside the deck', { pedestrianWays: [{ x: 51, y: 51 }, { x: 54, y: 51 }] }],
    ['a Water tile beside the deck', { waterTiles: [{ x: 51, y: 51 }] }],
  ])('refuses %s', (_name, overrides) => {
    expect(failureKey(crossing(3, overrides), footbridge(50, 3))).toBe('error.tilesOccupied');
  });

  it('cannot lie over or under another Bridge', () => {
    const placed = succeed(crossing(), footbridge(50, 1));
    expect(failureKey(placed, footbridge(50, 1))).toBe('error.tilesOccupied');
    expect(failureKey(placed, footbridge(50, 1, -1))).toBe('error.tilesOccupied');
  });
});

describe('Building around a Footbridge', () => {
  it('keeps its corridors and stairs free of buildings and Roads', () => {
    const placed = succeed(crossing(), footbridge(50, 1));
    expect(failureKey(placed, { type: 'PlaceBuilding', buildingType: 'home', x: 49, y: 51 })).not.toBeNull();
    expect(failureKey(placed, { type: 'BuildRoad', from: { x: 49, y: 50 }, to: { x: 49, y: 52 } })).toBe('error.tilesOccupied');
  });

  it('refuses to demolish the last Road under the deck', () => {
    const placed = succeed(crossing(), footbridge(50, 1));
    expect(failureKey(placed, { type: 'DemolishRoad', x: 50, y: 50 })).toBe('error.bridgeLastCrossing');
  });

  it('demolishes a Road under the lane beside the deck while the deck is still over a Road', () => {
    const placed = succeed(crossing(), footbridge(50, 1));
    expect(failureKey(placed, { type: 'DemolishRoad', x: 50, y: 51 })).toBeNull();
  });
});

describe('Removing a Footbridge', () => {
  it('refunds it at the sell ratio and leaves the Roads as they are', () => {
    const state = crossing();
    const placed = succeed(state, footbridge(50, 3 - 2));
    const removed = succeed(placed, { type: 'RemoveBridge', x: 49, y: 51 });
    expect(removed.bridges).toEqual([]);
    expect(removed.roads).toEqual(state.roads);
    expect(removed.urbs).toBeGreaterThan(placed.urbs);
    expect(removed.urbs).toBeLessThan(state.urbs);
  });
});
