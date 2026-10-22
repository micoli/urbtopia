import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { pedestrianGraph, sidewalkNode } from '../map/pedestrianGraph';
import { buildRoadGraph } from '../map/roadGraph';
import { buildNetworkGraph } from '../transit/transitNetwork';
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
const column = (x: number, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x, y: from + index }));
const overpass = (x: number, length: number, y = 50, axis: 'x' | 'y' = 'x'): Command => ({ type: 'PlaceBridge', x, y, length, axis, carrier: 'road' });

// Roads on y=50 at x=48..51 and x=57..60. A Bridge of span 3 starts at x=53: ramps at 52 and 56, span 53..55.
function crossing(overrides: Partial<GameState> = {}): GameState {
  const base = newGame({ seed: 'overpass', now: T0 });
  return {
    ...base, urbs: 100_000, tutorial: null, adaptationUntil: 0, nextId: 300,
    roads: [...row(48, 51), ...row(57, 60)].map((tile) => ({ ...tile, kind: 'road' as const })),
    buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 6 }],
    rails: column(54, 47, 53).map((tile) => ({ ...tile, exits: tile.y === 47 ? ['S' as const] : tile.y === 53 ? ['N' as const] : ['N' as const, 'S' as const] })),
    ...overrides,
  };
}

describe('Placing a Bridge over infrastructure', () => {
  it.each([[1, 300], [2, 450], [3, 600], [5, 950]])('a Road Bridge of span %i costs %i Urbs, ramps included', (length, price) => {
    const start = 53;
    const state = crossing({ roads: [...row(48, 51), ...row(start + length + 1, 62)].map((tile) => ({ ...tile, kind: 'road' as const })), rails: column(start, 47, 53).map((tile) => ({ ...tile, exits: ['N' as const, 'S' as const] })) });
    expect(succeed(state, overpass(start, length)).urbs).toBe(100_000 - price);
  });

  it('adds one ramp Road tile at each end of the span and records the carrier', () => {
    const placed = succeed(crossing(), overpass(53, 3));
    expect(placed.bridges).toEqual([{ x: 53, y: 50, length: 3, axis: 'x', carrier: 'road' }]);
    expect(placed.roads.filter((road) => road.x >= 52 && road.x <= 56).map((road) => road.x).sort()).toEqual([52, 56]);
  });

  it('unlocks at 120 Citizens', () => {
    const small = crossing({ buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 5 }] });
    expect(failureKey(small, overpass(53, 3))).toBe('error.itemLocked');
  });

  it('needs enough Urbs', () => {
    expect(failureKey(crossing({ urbs: 599 }), overpass(53, 3))).toBe('error.notEnoughUrbs');
  });

  it('needs infrastructure under the span', () => {
    expect(failureKey(crossing({ rails: [] }), overpass(53, 3))).toBe('error.bridgeNeedsInfrastructure');
  });

  it('needs a Road at each outer end', () => {
    expect(failureKey(crossing({ roads: row(48, 51).map((tile) => ({ ...tile, kind: 'road' as const })) }), overpass(53, 3))).toBe('error.bridgeNeedsRoad');
  });

  it('needs free land for the ramps', () => {
    const blocked = crossing({ buildings: [...crossing().buildings, createBuilding(2, 'home', 52, 50, 0)] });
    expect(failureKey(blocked, overpass(53, 3))).toBe('error.tilesOccupied');
  });

  it.each<[string, Partial<GameState>]>([['a building', { buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 6 }, createBuilding(2, 'home', 55, 50, 0)] }], ['a Field', { fields: [{ x: 55, y: 50 }] }], ['a Pedestrian way', { pedestrianWays: [{ x: 55, y: 50 }] }]])('refuses %s under the span', (_name, overrides) => {
    expect(failureKey(crossing(overrides), overpass(53, 3))).toBe('error.tilesOccupied');
  });

  it('refuses a Water tile under the span', () => {
    expect(failureKey(crossing({ waterTiles: [{ x: 55, y: 50 }] }), overpass(53, 3))).toBe('error.tilesOccupied');
  });

  it('only crosses infrastructure that runs across the span', () => {
    const along = crossing({ rails: row(53, 55).map((tile) => ({ ...tile, exits: tile.x === 53 ? ['E' as const] : tile.x === 55 ? ['W' as const] : ['E' as const, 'W' as const] })) });
    expect(failureKey(along, overpass(53, 3))).toBe('error.bridgeCrossesAlong');
  });

  it('cannot start or end on a Road tile, which would join the ramp', () => {
    const state = crossing({ roads: [...row(48, 51), ...row(57, 60), { x: 53, y: 49 }, { x: 53, y: 50 }, { x: 53, y: 51 }].map((tile) => ({ ...tile, kind: 'road' as const })) });
    expect(failureKey(state, overpass(53, 3))).toBe('error.tilesOccupied');
  });

  it('cannot have a Road beside a ramp, which would join it', () => {
    const state = crossing({ roads: [...row(48, 51), ...row(57, 60), { x: 52, y: 49 }].map((tile) => ({ ...tile, kind: 'road' as const })) });
    expect(failureKey(state, overpass(53, 3))).toBe('error.tilesOccupied');
  });

  it('cannot lie over or under another Bridge', () => {
    const placed = succeed(crossing(), overpass(53, 3));
    expect(failureKey(placed, overpass(54, 1, 49, 'y'))).not.toBeNull();
    expect(failureKey(placed, overpass(53, 3))).toBe('error.tilesOccupied');
  });
});

describe('A Bridge over infrastructure in the Road graph', () => {
  it('leaves the network beneath untouched, even a Road', () => {
    const lower = crossing({ rails: [], roads: [...row(48, 51), ...row(57, 60), ...column(54, 47, 53)].map((tile) => ({ ...tile, kind: 'road' as const })) });
    const placed = succeed(lower, overpass(53, 3));
    expect([...roadExits(placed, { x: 54, y: 50 })].sort()).toEqual(['N', 'S']);
    expect(roadExits(placed, { x: 52, y: 50 })).toEqual(['W']);
  });

  it('lets a Home reach a workplace on the other side of a Railway', () => {
    const supplied = crossing({ buildings: [...crossing().buildings, { ...createBuilding(2, 'waterTower', 58, 56, 0), tier: 3 }] });
    const town = succeed(succeed(supplied, { type: 'PlaceBuilding', buildingType: 'home', x: 49, y: 49 }), { type: 'PlaceBuilding', buildingType: 'workshop', x: 58, y: 48 });
    const homeId = town.buildings.find((building) => building.id !== 1 && building.type === 'home')!.id;
    expect(congestionStats(town).homes.get(homeId)?.disconnected).toBe(true);
    expect(congestionStats(succeed(town, overpass(53, 3))).homes.get(homeId)?.disconnected).toBe(false);
  });
});

describe('A Bridge over infrastructure for Pedestrians', () => {
  it('carries the Sidewalks of both banks across the span', () => {
    const placed = succeed(crossing(), overpass(53, 3));
    const edges = pedestrianGraph(placed).get(sidewalkNode({ x: 52, y: 50 }, 'N')) ?? [];
    expect(edges.some((edge) => edge.to === sidewalkNode({ x: 56, y: 50 }, 'N') && edge.cost === 4)).toBe(true);
  });
});

describe('Removing a Bridge over infrastructure', () => {
  it('refunds part of its price and removes its ramps', () => {
    const placed = succeed(crossing(), overpass(53, 3));
    const removed = succeed(placed, { type: 'RemoveBridge', x: 54, y: 50 });
    expect(removed.bridges).toEqual([]);
    expect(removed.roads).toEqual(crossing().roads);
    expect(removed.urbs).toBe(placed.urbs + 450);
  });

  it('can be removed from a ramp, and a ramp Road tile cannot be demolished alone', () => {
    const placed = succeed(crossing(), overpass(53, 3));
    expect(failureKey(placed, { type: 'DemolishRoad', x: 52, y: 50 })).toBe('error.bridgeTile');
    expect(succeed(placed, { type: 'RemoveBridge', x: 56, y: 50 }).bridges).toEqual([]);
  });
});

const brtRow = (from: number, to: number, y = 50) =>
  row(from, to, y).map((tile) => ({ ...tile, exits: [...(tile.x > from ? ['W' as const] : []), ...(tile.x < to ? ['E' as const] : [])] }));
const brtOverpass = (x: number, length: number): Command => ({ type: 'PlaceBridge', x, y: 50, length, axis: 'x', carrier: 'brt' });

// BRT corridor on y=50 at x=48..51 and x=57..60, a Railway across at x=54.
function brtCrossing(overrides: Partial<GameState> = {}): GameState {
  return crossing({ roads: [], brtRoads: [...brtRow(48, 51), ...brtRow(57, 60)], ...overrides });
}

describe('A BRT Bridge', () => {
  it.each([[1, 450], [2, 675], [3, 900], [5, 1425]])('with a span of %i costs %i Urbs', (length, price) => {
    const start = 53;
    const state = brtCrossing({ brtRoads: [...brtRow(48, 51), ...brtRow(start + length + 1, 62)], rails: column(start, 47, 53).map((tile) => ({ ...tile, exits: ['N' as const, 'S' as const] })) });
    expect(succeed(state, brtOverpass(start, length)).urbs).toBe(100_000 - price);
  });

  it('adds BRT ramps that open onto the corridor at each end, and leaves the Roads alone', () => {
    const placed = succeed(brtCrossing(), brtOverpass(53, 3));
    expect(placed.bridges).toEqual([{ x: 53, y: 50, length: 3, axis: 'x', carrier: 'brt' }]);
    expect(placed.roads).toEqual([]);
    expect(placed.brtRoads?.find((tile) => tile.x === 52)?.exits).toEqual(['W']);
    expect(placed.brtRoads?.find((tile) => tile.x === 51)?.exits).toEqual(['W', 'E']);
    expect(placed.brtRoads?.find((tile) => tile.x === 57)?.exits).toEqual(['E', 'W']);
  });

  it('needs a BRT corridor at each end, not a Road', () => {
    expect(failureKey(brtCrossing({ brtRoads: brtRow(48, 51) }), brtOverpass(53, 3))).toBe('error.bridgeNeedsBrt');
    const roads = [...row(48, 51), ...row(57, 60)].map((tile) => ({ ...tile, kind: 'road' as const }));
    expect(failureKey(brtCrossing({ brtRoads: [], roads }), brtOverpass(53, 3))).toBe('error.bridgeNeedsBrt');
  });

  it('crosses a Road, a BRT corridor or a Railway', () => {
    const road = column(54, 47, 53).map((tile) => ({ ...tile, kind: 'road' as const }));
    expect(failureKey(brtCrossing({ rails: [], roads: road }), brtOverpass(53, 3))).toBeNull();
    const lower = column(54, 47, 53).map((tile) => ({ ...tile, exits: tile.y === 47 ? ['S' as const] : tile.y === 53 ? ['N' as const] : ['N' as const, 'S' as const] }));
    expect(failureKey(brtCrossing({ rails: [], brtRoads: [...brtRow(48, 51), ...brtRow(57, 60), ...lower] }), brtOverpass(53, 3))).toBeNull();
  });

  it('joins the BRT graph only, and not the BRT corridor beneath', () => {
    const lower = column(54, 47, 53).map((tile) => ({ ...tile, exits: tile.y === 47 ? ['S' as const] : tile.y === 53 ? ['N' as const] : ['N' as const, 'S' as const] }));
    const placed = succeed(brtCrossing({ rails: [], brtRoads: [...brtRow(48, 51), ...brtRow(57, 60), ...lower] }), brtOverpass(53, 3));
    const brt = buildNetworkGraph(placed, 'brt');
    expect(brt.get('52,50')).toEqual(expect.arrayContaining([{ x: 56, y: 50 }, { x: 51, y: 50 }]));
    expect(brt.get('54,50')).toEqual([{ x: 54, y: 49 }, { x: 54, y: 51 }]);
    expect(buildRoadGraph(placed).has('52,50')).toBe(false);
  });

  it('is removed with its ramps, and gives the corridor its ends back', () => {
    const placed = succeed(brtCrossing(), brtOverpass(53, 3));
    const removed = succeed(placed, { type: 'RemoveBridge', x: 54, y: 50 });
    expect(removed.bridges).toEqual([]);
    expect(removed.brtRoads).toEqual(brtCrossing().brtRoads);
    expect(removed.urbs).toBe(placed.urbs + 675);
  });
});
