import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Command, type CropId, type GameState } from '../index';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

function harvest(state: GameState, tiles: { x: number; y: number }[]) {
  const result = dispatch(state, { type: 'Harvest', tiles }, T0);
  if (!result.ok) throw new Error(result.error.key);
  return result;
}

const row = (count: number) => Array.from({ length: count }, (_, index) => ({ x: 50 + index, y: 50 }));
const ripe = (species: CropId) => ({ species, plantedAt: T0 - 2 * HOUR });
const growing = (species: CropId) => ({ species, plantedAt: T0 });

function farmland(crops: (ReturnType<typeof ripe> | undefined)[], overrides: Partial<GameState> = {}): GameState {
  const base = newGame({ seed: 'harvest', now: T0 });
  const buildings = [
    ...base.buildings,
    createBuilding(base.nextId, 'storehouse', 56, 59, 0),
    { ...createBuilding(base.nextId + 1, 'farm', 60, 62, 0), tier: 1 },
  ];
  return { ...base, nextId: base.nextId + 2, urbs: 1000, buildings, fields: crops.map((crop, index) => ({ x: 50 + index, y: 50, ...(crop ? { crop } : {}) })), ...overrides };
}

describe('Harvest', () => {
  it('collects ready Crops, returns the seed share as Seed packs and stores the rest as Crop Material', () => {
    const { state } = harvest(farmland([ripe('wheat'), ripe('wheat'), ripe('wheat'), ripe('wheat')]), row(4));
    expect(state.seedStock).toEqual({ wheat: 4 });
    expect(state.storage.materials).toEqual({ wheat: 8 });
    expect(state.fields.every(f => f.crop === undefined)).toBe(true);
  });

  it('rounds the seed share down per species and per sweep', () => {
    const one = harvest(farmland([ripe('wheat')]), row(1)).state;
    expect(one.seedStock).toEqual({ wheat: 1 });
    expect(one.storage.materials).toEqual({ wheat: 2 });
    const grass = harvest(farmland([ripe('grass'), ripe('grass'), ripe('grass')]), row(3)).state;
    expect(grass.seedStock).toEqual({ grass: 3 });
    expect(grass.storage.materials).toEqual({ grass: 3 });
  });

  it('handles several species in one sweep and leaves unready Crops growing', () => {
    const { state } = harvest(farmland([ripe('wheat'), ripe('carrot'), ripe('carrot'), growing('corn'), undefined]), row(5));
    expect(state.seedStock).toEqual({ wheat: 1, carrot: 2 });
    expect(state.storage.materials).toEqual({ wheat: 2, carrot: 4 });
    expect(state.fields.map(f => f.crop?.species)).toEqual([undefined, undefined, undefined, 'corn', undefined]);
  });

  it('only harvests the tiles under the pointer', () => {
    const { state } = harvest(farmland([ripe('wheat'), ripe('wheat')]), row(1));
    expect(state.fields.map(f => f.crop?.species)).toEqual([undefined, 'wheat']);
  });

  it('loses the seed surplus when the Farm seed stock is full, keeping the stored share', () => {
    const { state } = harvest(farmland([ripe('wheat'), ripe('wheat')], { seedStock: { flower: 19 } }), row(2));
    expect(state.seedStock).toEqual({ flower: 19, wheat: 1 });
    expect(state.storage.materials).toEqual({ wheat: 4 });
  });

  it('leaves Crops ready when the Materials compartment has no room', () => {
    const full = farmland([ripe('wheat')], { storage: { materials: { wood: 20 }, goods: {} } });
    expect(failureKey(full, { type: 'Harvest', tiles: row(1) })).toBe('error.storageFull');
    expect(full.fields[0]?.crop).toEqual(ripe('wheat'));
  });

  it('harvests only as many Crops as the Materials compartment can hold', () => {
    const { state } = harvest(farmland([ripe('wheat'), ripe('wheat'), ripe('wheat')], { storage: { materials: { wood: 15 }, goods: {} } }), row(3));
    expect(state.storage.materials).toEqual({ wood: 15, wheat: 4 });
    expect(state.fields.map(f => f.crop?.species)).toEqual([undefined, undefined, 'wheat']);
  });

  it('reports what was harvested for the scene', () => {
    const { events } = harvest(farmland([ripe('wheat'), growing('corn')]), row(2));
    expect(events).toContainEqual({ type: 'CropsHarvested', tiles: [{ x: 50, y: 50, species: 'wheat' }] });
  });

  it('refuses when no Crop is ready under the pointer', () => {
    expect(failureKey(farmland([growing('wheat'), undefined]), { type: 'Harvest', tiles: row(2) })).toBe('error.nothingToCollect');
  });
});
