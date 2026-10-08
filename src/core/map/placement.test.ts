import { describe, expect, it } from 'vitest';
import { autoRotation, createBuilding, dispatch, frontAccessModes, frontTiles, newGame, placementIssue, type Command, type GameState } from '../index';

const NOW = 1_700_000_000_000;
const initial = newGame({ seed: 'amber-fox-4821', now: NOW });

function run(state: GameState, command: Command, now = NOW) {
  return dispatch(state, command, now);
}

function succeed(state: GameState, command: Command): GameState {
  const result = run(state, command);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function failureKey(state: GameState, command: Command): string | null {
  const result = run(state, command);
  return result.ok ? null : result.error.key;
}

const place = (buildingType: 'shop' | 'storehouse' | 'home' | 'powerPlant' | 'waterTower' | 'workshop' | 'factory', x: number, y: number, rotation?: 0 | 1 | 2 | 3): Command => ({
  type: 'PlaceBuilding',
  buildingType,
  x,
  y,
  ...(rotation === undefined ? {} : { rotation }),
});

describe('starting city', () => {
  it('has a road in front of the free Workshop and Factory', () => {
    expect(initial.roads.length).toBeGreaterThan(0);
    expect(initial.roads.every((tile) => tile.y === 58)).toBe(true);
  });
});

describe('BuildRoad', () => {
  it('adds only the missing tiles of an L path and charges 2 Urbs per new tile', () => {
    const state = succeed(initial, { type: 'BuildRoad', from: { x: 62, y: 58 }, to: { x: 62, y: 60 }, horizontalFirst: false });
    expect(state.roads.filter((tile) => tile.x === 62).map((tile) => tile.y).sort()).toEqual([58, 59, 60]);
    expect(state.urbs).toBe(600 - 2 * 2);
  });

  it('refuses a road leaving the owned Parcels', () => {
    expect(failureKey(initial, { type: 'BuildRoad', from: { x: 79, y: 58 }, to: { x: 80, y: 58 } })).toBe('error.outsideOwnedParcels');
  });

  it('refuses a road through a building', () => {
    expect(failureKey(initial, { type: 'BuildRoad', from: { x: 54, y: 55 }, to: { x: 54, y: 57 } })).toBe('error.tilesOccupied');
  });

  it('refuses a road the player cannot afford', () => {
    const poor = { ...initial, urbs: 1 };
    expect(failureKey(poor, { type: 'BuildRoad', from: { x: 62, y: 58 }, to: { x: 62, y: 60 } })).toBe('error.notEnoughUrbs');
  });
});

describe('PlaceBuilding', () => {
  it('turns the front toward the adjacent road and charges the cost', () => {
    const state = succeed(initial, place('shop', 56, 57));
    const shop = state.buildings.find((building) => building.type === 'shop');
    expect(shop).toMatchObject({ x: 56, y: 57, rotation: 2 });
    expect(state.urbs).toBe(300);
  });

  it('turns the front toward the road above when placed below it', () => {
    const below = succeed(initial, place('shop', 56, 59));
    expect(below.buildings.find((b) => b.type === 'shop')?.rotation).toBe(0);
  });

  it('lets the player override the rotation, which can then fail the road rule', () => {
    expect(failureKey(initial, place('shop', 56, 57, 0))).toBe('error.needsRoadOrBrt');
  });

  it('refuses a building whose front does not touch a road', () => {
    expect(failureKey(initial, place('shop', 70, 70))).toBe('error.needsRoadOrBrt');
  });

  it('does not need a road for a Power plant or a Water tower', () => {
    const state = succeed(succeed(initial, place('powerPlant', 70, 70)), place('waterTower', 72, 70));
    expect(state.buildings.map((b) => b.type)).toEqual(expect.arrayContaining(['powerPlant', 'waterTower']));
  });

  it('refuses a footprint outside the owned Parcels', () => {
    expect(failureKey(initial, place('powerPlant', 100, 100))).toBe('error.outsideOwnedParcels');
    expect(failureKey(initial, place('factory', 79, 70))).toBe('error.outsideOwnedParcels');
  });

  it('refuses occupied tiles, including road tiles', () => {
    expect(failureKey(initial, place('powerPlant', 54, 56))).toBe('error.tilesOccupied');
    expect(failureKey(initial, place('powerPlant', 56, 58))).toBe('error.tilesOccupied');
  });

  it('refuses when Urbs are missing', () => {
    expect(failureKey({ ...initial, urbs: 10 }, place('powerPlant', 70, 70))).toBe('error.notEnoughUrbs');
  });

  it('allows a single Storehouse per city', () => {
    const state = succeed(initial, place('storehouse', 56, 59));
    expect(failureKey(state, place('storehouse', 58, 59))).toBe('error.storehouseExists');
  });
});

describe('SellBuilding', () => {
  it('refunds 75 % of the placement cost', () => {
    const state = succeed(initial, { type: 'SellBuilding', id: 1 });
    expect(state.buildings.some((b) => b.id === 1)).toBe(false);
    expect(state.urbs).toBe(600 + 75);
  });

  it('refuses an unknown building', () => {
    expect(failureKey(initial, { type: 'SellBuilding', id: 999 })).toBe('error.unknownBuilding');
  });
});

describe('DemolishRoad', () => {
  it('removes a road tile that no building depends on alone', () => {
    const state = succeed(initial, { type: 'DemolishRoad', x: 54, y: 58 });
    expect(state.roads.some((tile) => tile.x === 54 && tile.y === 58)).toBe(false);
  });

  it('refuses to demolish the last road touching the front of a building', () => {
    const state = succeed(initial, { type: 'DemolishRoad', x: 54, y: 58 });
    expect(failureKey(state, { type: 'DemolishRoad', x: 55, y: 58 })).toBe('error.lastAccessOfBuilding');
  });

  it('refuses to demolish where there is no road', () => {
    expect(failureKey(initial, { type: 'DemolishRoad', x: 70, y: 70 })).toBe('error.noRoadHere');
  });

  it('removes every road tile along a two-point path', () => {
    const state = succeed(initial, { type: 'DemolishRoadPath', from: { x: 54, y: 58 }, to: { x: 54, y: 58 } });
    expect(state.roads.some((tile) => tile.x === 54 && tile.y === 58)).toBe(false);
    expect(failureKey(initial, { type: 'DemolishRoadPath', from: { x: 70, y: 70 }, to: { x: 72, y: 70 } })).toBe('error.noRoadHere');
  });
});

describe('MoveBuilding', () => {
  it('moves a building for free to another valid place', () => {
    const state = succeed(initial, { type: 'MoveBuilding', id: 1, x: 56, y: 59 });
    expect(state.buildings.find((b) => b.id === 1)).toMatchObject({ x: 56, y: 59, rotation: 0 });
    expect(state.urbs).toBe(initial.urbs);
  });

  it('refuses an invalid destination and keeps the building where it was', () => {
    expect(failureKey(initial, { type: 'MoveBuilding', id: 1, x: 70, y: 70 })).toBe('error.needsRoad');
  });

  it('may overlap its own previous tiles', () => {
    const state = succeed(initial, { type: 'MoveBuilding', id: 1, x: 55, y: 56 });
    expect(state.buildings.find((b) => b.id === 1)).toMatchObject({ x: 55, y: 56 });
  });
});

describe('PlaceCrossing', () => {
  it('turns a straight road tile into a crossing', () => {
    const state = succeed(initial, { type: 'PlaceCrossing', x: 57, y: 58 });
    expect(state.roads.find((tile) => tile.x === 57 && tile.y === 58)?.kind).toBe('crossing');
  });

  it('refuses a tile that is not a straight road', () => {
    expect(failureKey(initial, { type: 'PlaceCrossing', x: 53, y: 58 })).toBe('error.invalidCrossing');
    expect(failureKey(initial, { type: 'PlaceCrossing', x: 70, y: 70 })).toBe('error.noRoadHere');
  });
});

describe('PlaceRoundabout', () => {
  it('occupies a 3x3 square centred on the given tile', () => {
    const state = succeed(initial, { type: 'PlaceRoundabout', x: 70, y: 70 });
    expect(failureKey(state, place('powerPlant', 71, 71))).toBe('error.tilesOccupied');
    expect(failureKey(state, place('powerPlant', 72, 72))).toBeNull();
  });

  it('counts as a road for the front of a building', () => {
    const state = succeed(initial, { type: 'PlaceRoundabout', x: 70, y: 70 });
    expect(failureKey(state, place('shop', 70, 72))).toBeNull();
  });

  it('refuses a square leaving the owned Parcels', () => {
    expect(failureKey(initial, { type: 'PlaceRoundabout', x: 79, y: 70 })).toBe('error.outsideOwnedParcels');
  });
});

describe('dispatch clock', () => {
  it('moves lastSeen forward on a successful command and never backward', () => {
    const later = run(initial, place('powerPlant', 70, 70), NOW + 5000);
    if (!later.ok) throw new Error('expected success');
    expect(later.state.lastSeen).toBe(NOW + 5000);
    const earlier = run(later.state, place('waterTower', 72, 70), NOW);
    if (!earlier.ok) throw new Error('expected success');
    expect(earlier.state.lastSeen).toBe(NOW + 5000);
  });
});

describe('access modes', () => {
  const at = { x: 62, y: 66 };
  const withBrt = (type: 'home' | 'workshop' | 'brtStation', rotation: 0 | 1 | 2 | 3, roads: GameState['roads'] = []): GameState => {
    const front = frontTiles(type, at.x, at.y, rotation);
    return { ...initial, roads, rails: [], brtRoads: front.map((tile) => ({ ...tile, exits: ['E', 'W'] as const })) as never };
  };
  const withRoad = (type: 'home' | 'workshop', rotation: 0 | 1 | 2 | 3): GameState => ({
    ...initial,
    roads: frontTiles(type, at.x, at.y, rotation).map((tile) => ({ ...tile, kind: 'road' as const })),
  });

  it('accepts a BRT corridor in front of a Home without a road', () => {
    expect(placementIssue(withBrt('home', 0), 'home', at.x, at.y, 0)).toBeNull();
  });

  it('accepts a road in front of a Home as before', () => {
    expect(placementIssue(withRoad('home', 0), 'home', at.x, at.y, 0)).toBeNull();
  });

  it('refuses a Home with neither a road nor a BRT corridor, naming both', () => {
    expect(placementIssue({ ...initial, brtRoads: [] }, 'home', at.x, at.y, 0)).toBe('error.needsRoadOrBrt');
  });

  it('keeps asking for a road from buildings that do not accept the BRT', () => {
    expect(placementIssue(withBrt('workshop', 0), 'workshop', at.x, at.y, 0)).toBe('error.needsRoad');
  });

  it('does not accept a rail tile as access', () => {
    const rails = frontTiles('home', at.x, at.y, 0).map((tile) => ({ ...tile, exits: ['E', 'W'] as const }));
    expect(placementIssue({ ...initial, brtRoads: [], rails: rails as never }, 'home', at.x, at.y, 0)).toBe('error.needsRoadOrBrt');
  });

  it('lists the modes that touch the front', () => {
    const both: GameState = { ...withBrt('home', 0), roads: frontTiles('home', at.x, at.y, 0).map((tile) => ({ ...tile, kind: 'road' as const })) };
    expect(frontAccessModes(both, 'home', at.x, at.y, 0)).toEqual(['road', 'brt']);
    expect(frontAccessModes(withBrt('home', 0), 'home', at.x, at.y, 0)).toEqual(['brt']);
  });

  it('faces the BRT corridor when there is no road', () => {
    const state = withBrt('home', 1);
    expect(autoRotation(state, 'home', at.x, at.y)).toBe(1);
  });

  it('prefers the road over the BRT corridor', () => {
    const roadFront = frontTiles('home', at.x, at.y, 3).map((tile) => ({ ...tile, kind: 'road' as const }));
    const brtFront = frontTiles('home', at.x, at.y, 1).map((tile) => ({ ...tile, exits: ['E', 'W'] as const }));
    const state: GameState = { ...initial, roads: roadFront, rails: [], brtRoads: brtFront as never };
    expect(autoRotation(state, 'home', at.x, at.y)).toBe(3);
  });

  it('keeps stations on their own network', () => {
    expect(placementIssue(withBrt('brtStation', 0), 'brtStation', at.x, at.y, 0)).toBeNull();
  });
});

describe('last access of a building', () => {
  const home = createBuilding(900, 'home', 62, 66, 0);
  const [front] = frontTiles('home', 62, 66, 0);
  const brtOnly: GameState = { ...initial, roads: [], rails: [], brtRoads: [{ ...front!, exits: [] }], buildings: [...initial.buildings, home] };
  const brtTile = { type: 'DemolishTransit', mode: 'brt', from: front!, to: front! } as const;

  it('refuses to remove the BRT tile that is the only access of a Home', () => {
    expect(failureKey(brtOnly, brtTile)).toBe('error.lastAccessOfBuilding');
  });

  it('allows removing the BRT tile when a road still touches the front', () => {
    const both: GameState = { ...brtOnly, roads: [{ ...front!, kind: 'road' }] };
    expect(succeed(both, brtTile).brtRoads).toEqual([]);
  });

  it('allows removing the road when a BRT tile still touches the front', () => {
    const both: GameState = { ...brtOnly, roads: [{ ...front!, kind: 'road' }] };
    expect(succeed(both, { type: 'DemolishRoad', x: front!.x, y: front!.y }).roads).toEqual([]);
  });

  it('refuses to remove the last road even when only the BRT mode would have been allowed', () => {
    const roadOnly: GameState = { ...brtOnly, brtRoads: [], roads: [{ ...front!, kind: 'road' }] };
    expect(failureKey(roadOnly, { type: 'DemolishRoad', x: front!.x, y: front!.y })).toBe('error.lastAccessOfBuilding');
  });

  it('ignores a building that already had no access', () => {
    const stranded: GameState = { ...brtOnly, brtRoads: [], roads: [{ x: 70, y: 70, kind: 'road' }] };
    expect(succeed(stranded, { type: 'DemolishRoad', x: 70, y: 70 }).roads).toEqual([]);
  });
});
