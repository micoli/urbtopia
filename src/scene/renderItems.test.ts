import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type GameState } from '../core';
import { MODEL_KEYS, PROCEDURAL_MODELS, WATER_TILE_MODEL, modelOf, railItems, chunkKeyOf, renderItemsOf } from './renderItems';

describe('renderItemsOf', () => {
  const state = newGame({ seed: 'amber-fox-4821', now: 0 });

  it('renders BRT tiles with road kit pieces in variation A', () => {
    const brtRoads = [{ x: 60, y: 60, exits: ['E' as const] }, { x: 61, y: 60, exits: ['W' as const, 'E' as const] }, { x: 62, y: 60, exits: ['W' as const] }];
    const items = renderItemsOf({ ...state, brtRoads }).filter((item) => item.textureVariant === 'roads-a');
    expect(items.map((item) => item.model)).toEqual(['streets/road-end', 'streets/road-straight', 'streets/road-end']);
    expect(items[1]).toMatchObject({ x: 61.5, z: 60.5 });
  });

  it('centres each building on its footprint', () => {
    const workshop = renderItemsOf(state).find((item) => item.model.startsWith('buildings/workshop-'));
    expect(workshop).toMatchObject({ x: 55, z: 57, rotation: 2 });
  });

  it('turns a building by quarter turns', () => {
    const rotated = { ...state, roads: [], buildings: [createBuilding(9, 'factory', 10, 20, 1)] };
    expect(renderItemsOf(rotated)).toEqual([{ model: 'buildings/factory-2x2-t1-tone-a', x: 11, z: 21, rotation: 1, buildingId: 9 }]);
  });
});

describe('renderItemsOf Public facilities', () => {
  const only = (type: 'school' | 'mosque' | 'hospital' | 'theater') => renderItemsOf({ ...newGame({ seed: 'amber-fox-4821', now: 0 }), roads: [], buildings: [createBuilding(9, type, 10, 20, 0)] });

  it('resizes a facility whose model is not drawn to scale', () => {
    const [item] = only('mosque');
    expect(item).toMatchObject({ fitModel: item!.model });
    expect(item!.footprint).toBeGreaterThan(0);
  });

  it.each(['school', 'hospital', 'theater'] as const)('draws the %s as it is, with no resize, tint, detail or overlay', (type) => {
    const items = only(type);
    expect(items).toHaveLength(1);
    expect(Object.keys(items[0]!).sort()).toEqual(['buildingId', 'model', 'rotation', 'x', 'z']);
  });
});

describe('renderItemsOf Tier models', () => {
  it('renders the four coal plant evolutions and preloads every model', () => {
    const models = [1, 2, 3, 4].map((tier) => `buildings/coal-1x1-t${tier}-tone-a`);
    for (const [i, model] of models.entries()) {
      const building = { ...createBuilding(9, 'coalPlant', 10, 20, 1), tier: i + 1 };
      expect(modelOf('coalPlant', i + 1)).toBe(model);
      expect(MODEL_KEYS).toContain(model);
      expect(renderItemsOf({ ...newGame({ seed: 'coal-models', now: 0 }), roads: [], buildings: [building] })).toEqual([{ model, x: 10.5, z: 20.5, rotation: 1, buildingId: 9 }]);
    }
  });
  const modelAt = (type: 'factory' | 'storehouse' | 'materialDepot' | 'vault' | 'grainSilo', tier: number) => {
    const building = { ...createBuilding(9, type, 10, 20, 0), tier };
    return renderItemsOf({ ...newGame({ seed: 'amber-fox-4821', now: 0 }), roads: [], buildings: [building] })[0]?.model;
  };

  it('gives each Factory Tier its own model', () => {
    const models = [1, 2, 3, 4, 5].map((tier) => modelAt('factory', tier));
    expect(new Set(models).size).toBe(5);
  });

  it('switches the Storehouse model from Tier 4', () => {
    expect(modelAt('storehouse', 3)).not.toBe(modelAt('storehouse', 4));
  });

  it('shows the Material depot and the Vault with models of their own', () => {
    expect(new Set([modelAt('storehouse', 1), modelAt('materialDepot', 1), modelAt('vault', 1)]).size).toBe(3);
  });
});

describe('Grain silo models', () => {
  const modelAt = (tier: number) => {
    const building = { ...createBuilding(9, 'grainSilo', 10, 20, 0), tier };
    return renderItemsOf({ ...newGame({ seed: 'amber-fox-4821', now: 0 }), roads: [], buildings: [building] })[0]?.model;
  };

  it('gives each Tier its own silo model', () => {
    const models = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(modelAt);
    expect(new Set(models).size).toBe(10);
    expect(models[0]).toBe('buildings/silo-2x2-t1-tone-a');
  });
});

describe('renderItemsOf caching', () => {
  const state = newGame({ seed: 'amber-fox-4821', now: 0 });

  it('reuses the items while buildings and roads are unchanged', () => {
    const items = renderItemsOf(state);
    expect(renderItemsOf({ ...state, urbs: state.urbs + 1 })).toBe(items);
  });

  it('reuses the items when the buildings are replaced by identical copies', () => {
    const items = renderItemsOf(state);
    expect(renderItemsOf({ ...state, buildings: state.buildings.map((building) => ({ ...building, taxCitizenMs: 5 })) })).toBe(items);
  });

  it('rebuilds the items when a building is upgraded', () => {
    const home = createBuilding(9, 'home', 10, 20, 0);
    const base = { ...state, buildings: [home] };
    const items = renderItemsOf(base);
    expect(renderItemsOf({ ...base, buildings: [{ ...home, tier: 2 }] })).not.toBe(items);
  });

  it('rebuilds the items when the roads change', () => {
    const items = renderItemsOf(state);
    const longer = { ...state, roads: [...state.roads, { x: 63, y: 58, kind: 'road' as const }] };
    expect(renderItemsOf(longer)).not.toBe(items);
  });
});

describe('road items', () => {
  const state = newGame({ seed: 'amber-fox-4821', now: 0 });

  it('uses straight pieces in the middle of a road and an end piece at its extremity', () => {
    const items = renderItemsOf(state).filter((item) => item.model.startsWith('streets/'));
    expect(items.find((item) => item.x === 57.5)).toMatchObject({ model: 'streets/road-straight', rotation: 0 });
    expect(items.find((item) => item.x === 53.5)).toMatchObject({ model: 'streets/road-end', rotation: 0 });
    expect(items.find((item) => item.x === 62.5)).toMatchObject({ model: 'streets/road-end', rotation: 2 });
  });
});

describe('roundabout items', () => {
  const state = newGame({ seed: 'amber-fox-4821', now: 0 });
  const roundaboutAt = (roads: [number, number][]) => renderItemsOf({ ...state, roads: roads.map(([x, y]) => ({ x, y, kind: 'road' as const })), roundabouts: [{ x: 20, y: 20 }], buildings: [] }).find((item) => item.x === 20.5 && item.z === 20.5);

  it('uses the four-exit model unless exactly three roads are attached', () => {
    expect(roundaboutAt([[22, 20], [18, 20]])).toMatchObject({ model: 'streets/road-roundabout', rotation: 0 });
    expect(roundaboutAt([[22, 20], [18, 20], [20, 22], [20, 18]])).toMatchObject({ model: 'streets/road-roundabout', rotation: 0 });
  });

  it('turns the three-exit model so its closed side faces the missing road', () => {
    expect(roundaboutAt([[22, 20], [18, 20], [20, 22]])).toMatchObject({ model: 'streets/road-roundabout-three', rotation: 0 });
    expect(roundaboutAt([[22, 20], [18, 20], [20, 18]])).toMatchObject({ model: 'streets/road-roundabout-three', rotation: 2 });
    expect(roundaboutAt([[18, 20], [20, 22], [20, 18]])).toMatchObject({ model: 'streets/road-roundabout-three', rotation: 3 });
  });
});

describe('chunkKeyOf', () => {
  it('groups tiles by 16x16 chunks', () => {
    expect(chunkKeyOf(15.5, 0.2)).toBe('0,0');
    expect(chunkKeyOf(16, 31.9)).toBe('1,1');
  });
});

it('uses the railway models for straights, corners and branch arms', () => {
  const state = newGame({ seed: 'rail-models', now: 0 });
  expect(railItems({ ...state, rails: [{ x: 0, y: 0, exits: ['E', 'W'] }] })).toMatchObject([{ model: 'trains/railroad-straight', rotation: 1 }]);
  for (const [exits, rotation] of [[['N', 'W'], 0], [['W', 'S'], 1], [['S', 'E'], 2], [['E', 'N'], 3]] as const) {
    expect(railItems({ ...state, rails: [{ x: 0, y: 0, exits: [...exits] }] })).toMatchObject([{ model: 'trains/railroad-corner-small', rotation }]);
  }
  expect(railItems({ ...state, rails: [{ x: 0, y: 0, exits: ['N', 'E', 'W'] }] })).toHaveLength(3);
  const before = renderItemsOf(state);
  expect(renderItemsOf({ ...state, rails: [{ x: 0, y: 0, exits: ['E', 'W'] }] })).not.toBe(before);
});

describe('renderItemsOf farming', () => {
  const HOUR = 3_600_000;
  const base = { ...newGame({ seed: 'farm-render', now: 10 * HOUR }), roads: [], buildings: [] };
  const withFields = (fields: GameState['fields'], lastSeen = base.lastSeen): GameState => ({ ...base, lastSeen, fields });
  const fieldModels = (state: GameState, afterHarvest: Parameters<typeof renderItemsOf>[1] = []) => renderItemsOf(state, afterHarvest).map((item) => item.model);

  it('lays a soil tile under every Field, centred on its tile', () => {
    const items = renderItemsOf(withFields([{ x: 50, y: 60 }]));
    expect(items).toEqual([{ model: 'procedural/field-soil', x: 50.5, z: 60.5, rotation: 0 }]);
  });

  it('shows the growth stage of a planted Crop from the clock', () => {
    const planted = (minutes: number) => withFields([{ x: 50, y: 60, crop: { species: 'wheat', plantedAt: base.lastSeen - minutes * 60_000 } }]);
    expect(fieldModels(planted(0))).toContain('crops/wheat-1');
    expect(fieldModels(planted(2))).toContain('crops/wheat-2');
    expect(fieldModels(planted(3))).toContain('crops/wheat-3');
    expect(fieldModels(planted(4))).toContain('crops/wheat-4');
  });

  it('shows the mature plant with its produce when ready, and only the plant when the species has no produce model', () => {
    const ready = (species: 'apple' | 'grass') => withFields([{ x: 50, y: 60, crop: { species, plantedAt: 0 } }]);
    expect(fieldModels(ready('apple'))).toEqual(expect.arrayContaining(['crops/apple-4', 'crops/apple-crop']));
    expect(fieldModels(ready('grass'))).toContain('crops/grass-4');
    expect(fieldModels(ready('grass')).filter((model) => model.endsWith('_Crop'))).toEqual([]);
  });

  it('shows the after-harvest stage on a just harvested tile, when the species has one', () => {
    const harvested = [{ x: 50, y: 60, species: 'apple' as const }, { x: 51, y: 60, species: 'wheat' as const }];
    const state = withFields([{ x: 50, y: 60 }, { x: 51, y: 60 }]);
    expect(fieldModels(state, harvested)).toContain('crops/apple-harvested');
    expect(fieldModels(state, harvested).filter((model) => model.startsWith('crops/wheat'))).toEqual([]);
  });

  it('preloads every crop model', () => {
    expect(MODEL_KEYS).toEqual(expect.arrayContaining(['crops/wheat-1', 'crops/palmtree-1', 'crops/flowers-crop', 'buildings/farm-barn-2x2-tone-a']));
  });
});

describe('water models', () => {
  it('are built on demand from the shape of each tile, not preloaded as one model', () => {
    expect(PROCEDURAL_MODELS).not.toContain(WATER_TILE_MODEL);
    expect(PROCEDURAL_MODELS.every((key) => !key.startsWith(`${WATER_TILE_MODEL}:`))).toBe(true);
  });
});

describe('renderItemsOf water', () => {
  const base = { ...newGame({ seed: 'water-render', now: 0 }), roads: [], buildings: [] };

  it('lays a water tile on every Water tile, centred on its tile', () => {
    const items = renderItemsOf({ ...base, waterTiles: [{ x: 50, y: 60 }] });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ x: 50.5, z: 60.5, rotation: 0 });
    expect(items[0]!.model).toMatch(/^procedural\/water-tile:vvvv:/);
  });

  it('rounds the outer corners and fills the inside corner of an L-shaped lake', () => {
    const lake = [{ x: 50, y: 60 }, { x: 51, y: 60 }, { x: 50, y: 61 }];
    const codes = renderItemsOf({ ...base, waterTiles: lake }).map((item) => item.model.split(':')[1]);
    expect(codes).toEqual(['vfcf', 'fvvf', 'ffvv']);
  });

  it('does not fill an inside corner onto a road', () => {
    const lake = [{ x: 50, y: 60 }, { x: 51, y: 60 }, { x: 50, y: 61 }];
    const withRoad = { ...base, waterTiles: lake, roads: [{ x: 51, y: 61, kind: 'road' as const }] };
    const first = renderItemsOf(withRoad).find((item) => item.x === 50.5 && item.z === 60.5)!;
    expect(first.model.split(':')[1]).toBe('vfff');
  });

  it('keeps the same items while the Water tiles do not change', () => {
    const state = { ...base, waterTiles: [{ x: 50, y: 60 }] };
    expect(renderItemsOf({ ...state, urbs: 1 })).toBe(renderItemsOf(state));
  });
});

describe('renderItemsOf boats', () => {
  it('leaves Boats to the animated Boat layer', () => {
    const state = { ...newGame({ seed: 'boat-render', now: 0 }), roads: [], buildings: [], waterTiles: [{ x: 50, y: 60 }], boats: [{ id: 7, family: 'pleasure' as const, marinaId: 1, x: 50, y: 60 }] };
    expect(renderItemsOf(state).map((item) => item.model.split(':')[1])).toEqual(['vvvv']);
  });
});

describe('renderItemsOf bridges', () => {
  const base = {
    ...newGame({ seed: 'bridge-render', now: 0 }), buildings: [],
    waterTiles: [{ x: 52, y: 50 }],
    roads: [{ x: 51, y: 50, kind: 'road' as const }, { x: 52, y: 50, kind: 'road' as const }, { x: 53, y: 50, kind: 'road' as const }],
    bridges: [{ x: 52, y: 50, length: 1, axis: 'x' as const }],
  };

  it('leaves the deck and the Road of a Bridge to the animated Bridge layer', () => {
    const items = renderItemsOf(base);
    expect(items.some((item) => item.model === 'procedural/bridge-deck')).toBe(false);
    expect(items.some((item) => item.x === 52.5 && item.model.startsWith('streets/'))).toBe(false);
    expect(items.some((item) => item.x === 51.5 && item.model.startsWith('streets/'))).toBe(true);
    expect(items.some((item) => item.x === 52.5 && item.model.startsWith('procedural/water-tile'))).toBe(true);
  });
});

describe('renderItemsOf bridges over infrastructure', () => {
  const road = [{ x: 51, y: 50, kind: 'road' as const }, { x: 52, y: 50, kind: 'road' as const }, { x: 56, y: 50, kind: 'road' as const }, { x: 57, y: 50, kind: 'road' as const }];
  const base = { ...newGame({ seed: 'overpass-render', now: 0 }), buildings: [], roads: road, bridges: [{ x: 53, y: 50, length: 3, axis: 'x' as const, carrier: 'road' as const }] };

  it('draws a ramp at each end of the span and a deck tile per span tile, instead of the ramp Road tiles', () => {
    const items = renderItemsOf(base).filter((item) => item.z === 50.5);
    expect(items.filter((item) => item.model === 'streets/road-slant-flat-high').map((item) => [item.x, item.rotation])).toEqual([[52.5, 0], [56.5, 2]]);
    expect(items.filter((item) => item.model === 'streets/road-bridge').map((item) => item.x)).toEqual([53.5, 54.5, 55.5]);
    expect(items.filter((item) => item.x === 52.5 || item.x === 56.5).every((item) => item.model === 'streets/road-slant-flat-high')).toBe(true);
  });

  it('turns a vertical Bridge', () => {
    const vertical = { ...base, roads: [{ x: 50, y: 52, kind: 'road' as const }, { x: 50, y: 56, kind: 'road' as const }], bridges: [{ x: 50, y: 53, length: 3, axis: 'y' as const, carrier: 'road' as const }] };
    const ramps = renderItemsOf(vertical).filter((item) => item.model === 'streets/road-slant-flat-high');
    expect(ramps.map((item) => [item.z, item.rotation])).toEqual([[52.5, 3], [56.5, 1]]);
  });

  it('draws a BRT Bridge in variation A, without the BRT pieces of its ramps', () => {
    const brt = { ...base, roads: [], brtRoads: [{ x: 52, y: 50, exits: ['W' as const] }, { x: 56, y: 50, exits: ['E' as const] }], bridges: [{ x: 53, y: 50, length: 3, axis: 'x' as const, carrier: 'brt' as const }] };
    const items = renderItemsOf(brt).filter((item) => item.textureVariant === 'roads-a');
    expect(items.map((item) => item.model)).toEqual(['streets/road-slant-flat-high', 'streets/road-bridge', 'streets/road-bridge', 'streets/road-bridge', 'streets/road-slant-flat-high']);
  });
});

describe('renderItemsOf Footbridges', () => {
  const road = Array.from({ length: 5 }, (_, index) => ({ x: 50, y: 48 + index, kind: 'road' as const }));
  const city = (bridge: { axis: 'x' | 'y'; side: 1 | -1 }) => ({ ...newGame({ seed: 'footbridge-render', now: 0 }), buildings: [], roads: road, bridges: [{ x: 50, y: 50, length: 1, carrier: 'pedestrian' as const, ...bridge }] });
  const pieces = (state: GameState) => renderItemsOf(state).filter((item) => item.model.includes('footbridge')).map((item) => [item.model.replace('streets/footbridge-', ''), item.x, item.z, item.rotation]);

  it('draws two corridors, two stairs and a deck tile on the pedestrian texture, and nothing beside the deck', () => {
    const items = renderItemsOf(city({ axis: 'x', side: 1 })).filter((item) => item.model.includes('footbridge'));
    expect(items).toHaveLength(5);
    expect(items.every((item) => item.textureVariant === 'roads-pedestrian')).toBe(true);
  });

  it('keeps a corridor open at both ends when a Pedestrian way reaches its far end, and closes the end that reaches nothing', () => {
    const state = { ...city({ axis: 'x', side: 1 }), pedestrianWays: [{ x: 48, y: 51 }] };
    expect(pieces(state).filter(([model]) => String(model).startsWith('corridor'))).toEqual([['corridor', 49.5, 51.5, 2], ['corridor-closed-west', 51.5, 51.5, 2]]);
  });

  it.each([
    ['x', 1, [['corridor-closed-east', 49.5, 51.5, 2], ['corridor-closed-west', 51.5, 51.5, 2], ['stair-right', 49.5, 50.5, 0], ['stair-left', 51.5, 50.5, 2], ['deck', 50.5, 50.5, 0]]],
    ['x', -1, [['corridor-closed-west', 49.5, 49.5, 0], ['corridor-closed-east', 51.5, 49.5, 0], ['stair-left', 49.5, 50.5, 0], ['stair-right', 51.5, 50.5, 2], ['deck', 50.5, 50.5, 0]]],
    ['y', 1, [['corridor-closed-west', 51.5, 49.5, 3], ['corridor-closed-east', 51.5, 51.5, 3], ['stair-left', 50.5, 49.5, 3], ['stair-right', 50.5, 51.5, 1], ['deck', 50.5, 50.5, 1]]],
    ['y', -1, [['corridor-closed-east', 49.5, 49.5, 1], ['corridor-closed-west', 49.5, 51.5, 1], ['stair-right', 50.5, 49.5, 3], ['stair-left', 50.5, 51.5, 1], ['deck', 50.5, 50.5, 1]]],
  ] as const)('turns the pieces of a Footbridge on axis %s with the corridors on side %i', (axis, side, expected) => {
    expect(pieces(city({ axis, side }))).toEqual(expected);
  });
});

describe('renderItemsOf Livestock farm pens', () => {
  const farm = (rotation: 0 | 1 | 2 | 3, queue: GameState['buildings'][number]['queue']): GameState => ({
    ...newGame({ seed: 'amber-fox-4821', now: 0 }),
    roads: [],
    buildings: [{ ...createBuilding(9, 'livestockFarm', 10, 20, rotation), tier: 2, queue }],
  });
  const running = (item: 'henEgg' | 'milk'): GameState['buildings'][number]['queue'][number] => ({ item, duration: 60_000, startedAt: 0, done: false, quantity: 1 });

  it('draws no animal while nothing is produced', () => {
    expect(renderItemsOf(farm(0, [])).map((item) => item.model)).toEqual(['buildings/livestock-farm-2x2-t2-tone-a']);
  });

  it('draws the animal of each production in its pen, on the floor of the pen', () => {
    const items = renderItemsOf(farm(0, [running('henEgg'), { ...running('milk'), startedAt: null, done: true }]));
    expect(items.slice(1)).toEqual([
      { model: 'animals/hen', x: 11.64, z: 20.26, rotation: 0, elevation: 0.01, buildingId: 9 },
      { model: 'animals/cow', x: 11, z: 20.26, rotation: 0, elevation: 0.01, buildingId: 9 },
    ]);
  });

  it('draws the animal of a production still waiting for its Slot', () => {
    const items = renderItemsOf(farm(0, [running('henEgg'), { ...running('milk'), startedAt: null }]));
    expect(items.slice(1).map((item) => item.model)).toEqual(['animals/hen', 'animals/cow']);
  });

  it('turns the pens with the building', () => {
    const [, hen] = renderItemsOf(farm(2, [running('henEgg')]));
    expect(hen).toMatchObject({ model: 'animals/hen', x: 10.36, z: 21.74, rotation: 2 });
  });

  it('loads every animal model', () => {
    for (const animal of ['cow', 'sheep', 'goat', 'alpaca', 'hen', 'duck', 'silkworm']) expect(MODEL_KEYS).toContain(`animals/${animal}`);
  });
});
