import { describe, expect, it } from 'vitest';
import { CROPS, CROP_IDS, createBuilding, dispatch, isCropUnlocked, newGame, nextUnlock, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

function cityWith(homeTier: number, farmTier?: number): GameState {
  const base = newGame({ seed: 'seed-packs', now: T0 });
  const farm = farmTier ? [{ ...createBuilding(base.nextId + 1, 'farm', 56, 59, 0), tier: farmTier }] : [];
  return { ...base, urbs: 10_000, nextId: base.nextId + 2, buildings: [...base.buildings, { ...createBuilding(base.nextId, 'home', 40, 40, 0), tier: homeTier }, ...farm] };
}

describe('Crop species catalog', () => {
  it('lists eighteen species unlocked six at a time by Citizens', () => {
    expect(CROP_IDS).toHaveLength(18);
    const thresholds = CROP_IDS.map(id => CROPS[id].unlockCitizens);
    expect([...new Set(thresholds)]).toEqual([20, 60, 120, 250, 450, 800]);
  });

  it('starts from the values of the spec table', () => {
    expect(CROPS.wheat).toMatchObject({ growthMs: 5 * 60_000, water: 1, yield: 3, seedShare: 0.4, seedPrice: 3, unlockCitizens: 20 });
    expect(CROPS.palmtree).toMatchObject({ growthMs: 52 * 60_000, water: 3, yield: 8, seedShare: 0.2, seedPrice: 52, unlockCitizens: 800 });
  });

  it('unlocks a species only once the city has enough Citizens', () => {
    expect(isCropUnlocked(cityWith(3), 'wheat')).toBe(true);
    expect(isCropUnlocked(cityWith(3), 'carrot')).toBe(false);
    expect(isCropUnlocked(cityWith(4), 'carrot')).toBe(true);
  });

  it('announces species in the next Unlock', () => {
    expect(nextUnlock(cityWith(3))?.items).toEqual(expect.arrayContaining(['carrot', 'beet', 'lettuce']));
  });
});

describe('Buying Seed packs', () => {
  it('spends Urbs and adds packs to the seed stock', () => {
    const result = dispatch(cityWith(3, 1), { type: 'BuySeeds', crop: 'wheat', quantity: 5 }, T0);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.state.seedStock).toEqual({ wheat: 5 });
    expect(result.state.urbs).toBe(10_000 - 5 * 3);
  });

  it('needs a Farm', () => {
    expect(failureKey(cityWith(3), { type: 'BuySeeds', crop: 'wheat', quantity: 1 })).toBe('error.noFarm');
  });

  it('refuses a species that is not unlocked yet', () => {
    expect(failureKey(cityWith(3, 1), { type: 'BuySeeds', crop: 'carrot', quantity: 1 })).toBe('error.itemLocked');
  });

  it('refuses when Urbs are missing', () => {
    expect(failureKey({ ...cityWith(3, 1), urbs: 2 }, { type: 'BuySeeds', crop: 'wheat', quantity: 1 })).toBe('error.notEnoughUrbs');
  });

  it('only fills the stock up to the Farm capacity, charging for the packs received', () => {
    const state = { ...cityWith(3, 1), seedStock: { flower: 15 } };
    const result = dispatch(state, { type: 'BuySeeds', crop: 'wheat', quantity: 10 }, T0);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.state.seedStock).toEqual({ flower: 15, wheat: 5 });
    expect(result.state.urbs).toBe(10_000 - 5 * 3);
  });

  it('refuses when the seed stock is already full', () => {
    const state = { ...cityWith(3, 1), seedStock: { flower: 20 } };
    expect(failureKey(state, { type: 'BuySeeds', crop: 'wheat', quantity: 1 })).toBe('error.seedStockFull');
  });

  it('refuses a non positive or fractional quantity', () => {
    expect(failureKey(cityWith(3, 1), { type: 'BuySeeds', crop: 'wheat', quantity: 0 })).toBe('error.invalidQuantity');
    expect(failureKey(cityWith(3, 1), { type: 'BuySeeds', crop: 'wheat', quantity: 1.5 })).toBe('error.invalidQuantity');
  });
});
