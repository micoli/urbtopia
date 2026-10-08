import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type GameState } from '../core';
import { MODEL_KEYS, modelOf, railItems, chunkKeyOf, renderItemsOf } from './renderItems';

describe('renderItemsOf', () => {
  const state = newGame({ seed: 'amber-fox-4821', now: 0 });

  it('renders BRT tiles with road kit pieces in variation A', () => {
    const brtRoads = [{ x: 60, y: 60, exits: ['E' as const] }, { x: 61, y: 60, exits: ['W' as const, 'E' as const] }, { x: 62, y: 60, exits: ['W' as const] }];
    const items = renderItemsOf({ ...state, brtRoads }).filter((item) => item.textureVariant === 'roads-a');
    expect(items.map((item) => item.model)).toEqual(['roads/road-end', 'roads/road-straight', 'roads/road-end']);
    expect(items[1]).toMatchObject({ x: 61.5, z: 60.5 });
  });

  it('centres each building on its footprint', () => {
    const workshop = renderItemsOf(state).find((item) => item.model === 'industrial/building-h');
    expect(workshop).toMatchObject({ x: 55, z: 57, rotation: 2 });
  });

  it('turns a building by quarter turns', () => {
    const rotated = { ...state, roads: [], buildings: [createBuilding(9, 'factory', 10, 20, 1)] };
    expect(renderItemsOf(rotated)).toEqual([{ model: 'industrial/building-b', x: 11, z: 21, rotation: 1 }]);
  });
});

describe('renderItemsOf Tier models', () => {
  it('renders the four coal chimney evolutions and preloads every model', () => {
    const models = ['chimney-basic', 'chimney-small', 'chimney-medium', 'chimney-large'].map(model => `industrial/${model}`);
    for (const [i, model] of models.entries()) {
      const building = { ...createBuilding(9, 'coalPlant', 10, 20, 1), tier: i + 1 };
      expect(modelOf('coalPlant', i + 1)).toBe(model);
      expect(MODEL_KEYS).toContain(model);
      expect(renderItemsOf({ ...newGame({ seed: 'coal-models', now: 0 }), roads: [], buildings: [building] })).toEqual([{ model, x: 10.5, z: 20.5, rotation: 1 }]);
    }
  });
  const modelAt = (type: 'factory' | 'storehouse' | 'silo' | 'vault' | 'grainSilo', tier: number) => {
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

  it('shows the Silo and the Vault with models of their own', () => {
    expect(new Set([modelAt('storehouse', 1), modelAt('silo', 1), modelAt('vault', 1)]).size).toBe(3);
  });
});

describe('Grain silo models', () => {
  const modelAt = (tier: number) => {
    const building = { ...createBuilding(9, 'grainSilo', 10, 20, 0), tier };
    return renderItemsOf({ ...newGame({ seed: 'amber-fox-4821', now: 0 }), roads: [], buildings: [building] })[0]?.model;
  };

  it('uses the silo house, then the tall silo from Tier 4', () => {
    expect(modelAt(1)).toBe('farm/Silo_House');
    expect(modelAt(3)).toBe('farm/Silo_House');
    expect(modelAt(4)).toBe('farm/Silo');
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
    const items = renderItemsOf(state).filter((item) => item.model.startsWith('roads/'));
    expect(items.find((item) => item.x === 57.5)).toMatchObject({ model: 'roads/road-straight', rotation: 0 });
    expect(items.find((item) => item.x === 53.5)).toMatchObject({ model: 'roads/road-end', rotation: 0 });
    expect(items.find((item) => item.x === 62.5)).toMatchObject({ model: 'roads/road-end', rotation: 2 });
  });
});

describe('chunkKeyOf', () => {
  it('groups tiles by 16x16 chunks', () => {
    expect(chunkKeyOf(15.5, 0.2)).toBe('0,0');
    expect(chunkKeyOf(16, 31.9)).toBe('1,1');
  });
});

it('uses Kenney railway models for straights, corners and branch arms', () => {
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
    expect(fieldModels(planted(0))).toContain('crops/Wheat_1');
    expect(fieldModels(planted(2))).toContain('crops/Wheat_2');
    expect(fieldModels(planted(3))).toContain('crops/Wheat_3');
    expect(fieldModels(planted(4))).toContain('crops/Wheat_4');
  });

  it('shows the mature plant with its produce when ready, and only the plant when the species has no produce model', () => {
    const ready = (species: 'apple' | 'grass') => withFields([{ x: 50, y: 60, crop: { species, plantedAt: 0 } }]);
    expect(fieldModels(ready('apple'))).toEqual(expect.arrayContaining(['crops/Apple_4', 'crops/Apple_Crop']));
    expect(fieldModels(ready('grass'))).toContain('crops/Grass_4');
    expect(fieldModels(ready('grass')).filter((model) => model.endsWith('_Crop'))).toEqual([]);
  });

  it('shows the after-harvest stage on a just harvested tile, when the species has one', () => {
    const harvested = [{ x: 50, y: 60, species: 'apple' as const }, { x: 51, y: 60, species: 'wheat' as const }];
    const state = withFields([{ x: 50, y: 60 }, { x: 51, y: 60 }]);
    expect(fieldModels(state, harvested)).toContain('crops/Apple_Harvested');
    expect(fieldModels(state, harvested).filter((model) => model.startsWith('crops/Wheat'))).toEqual([]);
  });

  it('preloads every crop model', () => {
    expect(MODEL_KEYS).toEqual(expect.arrayContaining(['crops/Wheat_1', 'crops/Palmtree_1'.replace('Palmtree', 'PalmTree'), 'crops/Flowers_Crop', 'farm/Barn', 'farm/OpenBarn']));
  });
});

describe('renderItemsOf water', () => {
  const base = { ...newGame({ seed: 'water-render', now: 0 }), roads: [], buildings: [] };

  it('lays a water tile on every Water tile, centred on its tile', () => {
    const items = renderItemsOf({ ...base, waterTiles: [{ x: 50, y: 60 }] });
    expect(items).toEqual([{ model: 'procedural/water-tile', x: 50.5, z: 60.5, rotation: 0 }]);
  });

  it('keeps the same items while the Water tiles do not change', () => {
    const state = { ...base, waterTiles: [{ x: 50, y: 60 }] };
    expect(renderItemsOf({ ...state, urbs: 1 })).toBe(renderItemsOf(state));
  });
});

describe('renderItemsOf boats', () => {
  it('leaves Boats to the animated Boat layer', () => {
    const state = { ...newGame({ seed: 'boat-render', now: 0 }), roads: [], buildings: [], waterTiles: [{ x: 50, y: 60 }], boats: [{ id: 7, family: 'pleasure' as const, marinaId: 1, x: 50, y: 60 }] };
    expect(renderItemsOf(state).map((item) => item.model)).toEqual(['procedural/water-tile']);
  });
});

describe('renderItemsOf bridges', () => {
  const base = {
    ...newGame({ seed: 'bridge-render', now: 0 }), buildings: [],
    waterTiles: [{ x: 52, y: 50 }],
    roads: [{ x: 51, y: 50, kind: 'road' as const }, { x: 52, y: 50, kind: 'road' as const }, { x: 53, y: 50, kind: 'road' as const }],
    bridges: [{ x: 52, y: 50, length: 1, axis: 'x' as const }],
  };

  it('lifts the Road of a Bridge and lays a deck under it', () => {
    const items = renderItemsOf(base);
    expect(items.filter((item) => item.model === 'procedural/bridge-deck')).toHaveLength(1);
    expect(items.find((item) => item.x === 52.5 && item.model.startsWith('roads/'))?.elevation).toBeGreaterThan(0);
    expect(items.find((item) => item.x === 51.5 && item.model.startsWith('roads/'))?.elevation).toBeUndefined();
  });
});
