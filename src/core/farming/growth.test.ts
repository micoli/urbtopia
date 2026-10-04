import { describe, expect, it } from 'vitest';
import { advance, createBuilding, cropStage, dispatch, isCropReady, newGame, utilityCapacity, utilityDemand, type Command, type CropId, type GameState } from '../index';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

function failureKey(state: GameState, command: Command, now = T0): string | null {
  const result = dispatch(state, command, now);
  return result.ok ? null : result.error.key;
}

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
}

const row = (count: number, y = 50) => Array.from({ length: count }, (_, index) => ({ x: 50 + index, y }));

function farmland(seeds: GameState['seedStock'], fieldCount = 6, waterTowers = 1, homeTier = 3): GameState {
  const base = newGame({ seed: 'growth', now: T0 });
  const home = { ...createBuilding(base.nextId, 'home', 40, 40, 0), tier: homeTier };
  const farm = { ...createBuilding(base.nextId + 1, 'farm', 56, 59, 0), tier: 5 };
  const towers = Array.from({ length: waterTowers }, (_, index) => createBuilding(base.nextId + 2 + index, 'waterTower', 70 + index, 52, 0));
  const state: GameState = { ...base, urbs: 100_000, seedStock: seeds, nextId: base.nextId + 2 + waterTowers, buildings: [...base.buildings, home, farm, ...towers] };
  return { ...state, fields: row(fieldCount).map(({ x, y }) => ({ x, y })) };
}

const crop = (species: CropId, plantedAt = T0) => ({ species, plantedAt });

describe('Planting by sprinkling', () => {
  it('plants every empty Field tile touched, one Seed pack each, recording species and time', () => {
    const state = succeed(farmland({ wheat: 10 }), { type: 'Plant', crop: 'wheat', tiles: row(3) });
    expect(state.fields.slice(0, 3).map(f => f.crop)).toEqual([crop('wheat'), crop('wheat'), crop('wheat')]);
    expect(state.fields[3]?.crop).toBeUndefined();
    expect(state.seedStock).toEqual({ wheat: 7 });
  });

  it('ignores planted tiles and tiles that are not Fields', () => {
    const first = succeed(farmland({ wheat: 10 }), { type: 'Plant', crop: 'wheat', tiles: row(2) });
    const second = succeed(first, { type: 'Plant', crop: 'wheat', tiles: [...row(3), { x: 60, y: 60 }] });
    expect(second.seedStock).toEqual({ wheat: 7 });
    expect(failureKey(second, { type: 'Plant', crop: 'wheat', tiles: row(3) })).toBe('error.nothingToPlant');
  });

  it('stops when the seed stock of the species is empty', () => {
    const state = succeed(farmland({ wheat: 2 }), { type: 'Plant', crop: 'wheat', tiles: row(5) });
    expect(state.fields.filter(f => f.crop)).toHaveLength(2);
    expect(state.seedStock.wheat ?? 0).toBe(0);
    expect(failureKey(state, { type: 'Plant', crop: 'wheat', tiles: row(5) })).toBe('error.noSeeds');
  });

  it('needs a Farm and an unlocked species', () => {
    expect(failureKey({ ...farmland({ wheat: 1 }), buildings: [] }, { type: 'Plant', crop: 'wheat', tiles: row(1) })).toBe('error.noFarm');
    const lowCitizens = farmland({ carrot: 1 });
    expect(failureKey({ ...lowCitizens, buildings: lowCitizens.buildings.map(b => b.type === 'home' ? { ...b, tier: 1 } : b) }, { type: 'Plant', crop: 'carrot', tiles: row(1) })).toBe('error.itemLocked');
  });
});

describe('Growth stages', () => {
  it('splits the growth time equally in four stages, then is ready', () => {
    const wheat = crop('wheat');
    expect([0, 1.24, 1.25, 2.5, 3.75, 4.99, 5].map(minutes => cropStage(wheat, T0 + minutes * MINUTE))).toEqual([1, 1, 2, 3, 4, 4, 'ready']);
    expect(isCropReady(wheat, T0 + 5 * MINUTE)).toBe(true);
    expect(isCropReady(wheat, T0 + 5 * MINUTE - 1)).toBe(false);
  });

  it('waits indefinitely once ready', () => {
    expect(cropStage(crop('wheat'), T0 + 1000 * HOUR)).toBe('ready');
  });
});

describe('Growth over game time', () => {
  it('is ready after a long Catch-up, whatever the time away', () => {
    const planted = succeed(farmland({ wheat: 3 }), { type: 'Plant', crop: 'wheat', tiles: row(3) });
    const later = advance(planted, T0 + 100 * HOUR).state;
    expect(later.fields.every(f => !f.crop || isCropReady(f.crop, later.lastSeen))).toBe(true);
  });

  it('only counts the Catch-up cap of 48 game hours, not the forfeited time', () => {
    const growing = farmland({});
    const tail = { ...growing, fields: growing.fields.map((f, index) => index === 0 ? { ...f, crop: crop('palmtree', T0 + 47 * HOUR + 30 * MINUTE) } : f) };
    const later = advance(tail, T0 + 100 * HOUR).state;
    const planting = later.fields[0]!.crop!;
    expect(cropStage(planting, later.lastSeen)).not.toBe('ready');
    expect(later.lastSeen - planting.plantedAt).toBe(30 * MINUTE);
  });

  it('moves forward when time is skipped', () => {
    const planted = succeed(farmland({ wheat: 1 }), { type: 'Plant', crop: 'wheat', tiles: row(1) });
    const skipped = succeed(planted, { type: 'SkipTime', hours: 3 / 60 });
    expect(cropStage(skipped.fields[0]!.crop!, skipped.lastSeen)).toBe(3);
    expect(cropStage(succeed(planted, { type: 'SkipTime', hours: 5 / 60 }).fields[0]!.crop!, T0 + 5 * MINUTE)).toBe('ready');
  });
});

describe('Water demand of Crops', () => {
  it('adds the species water per growing tile and nothing once ready', () => {
    const before = farmland({ rice: 2 }, 6, 2, 6);
    const state = succeed(before, { type: 'Plant', crop: 'rice', tiles: row(2) });
    expect(utilityDemand(state).water - utilityDemand(before).water).toBe(8);
    expect(utilityDemand(advance(state, T0 + 16 * MINUTE).state).water).toBe(utilityDemand(before).water);
  });

  it('refuses planting when the extra Demand would exceed water Capacity, planting what fits', () => {
    const state = farmland({ rice: 10, wheat: 20 }, 14, 2, 6);
    expect(utilityCapacity(state).water - utilityDemand(state).water).toBe(8);
    const ricePlanted = succeed(state, { type: 'Plant', crop: 'rice', tiles: row(14) });
    expect(ricePlanted.fields.filter(f => f.crop)).toHaveLength(2);
    expect(failureKey(ricePlanted, { type: 'Plant', crop: 'rice', tiles: row(14) })).toBe('error.notEnoughWater');
    expect(failureKey(ricePlanted, { type: 'Plant', crop: 'wheat', tiles: row(14) })).toBe('error.notEnoughWater');
  });

  it('never penalises a Crop already planted', () => {
    const planted = succeed(farmland({ wheat: 4 }), { type: 'Plant', crop: 'wheat', tiles: row(4) });
    const drier = { ...planted, buildings: planted.buildings.filter(b => b.type !== 'waterTower') };
    expect(drier.fields.filter(f => f.crop)).toHaveLength(4);
    expect(advance(drier, T0 + MINUTE).state.fields.filter(f => f.crop)).toHaveLength(4);
  });
});
