import { describe, expect, it } from 'vitest';
import { CROP_IDS, GOODS, MATERIALS, createBuilding, dispatch, newGame, producibleItems, storageUsed, type Command, type GameState, type GoodId } from '../index';

const T0 = 1_700_000_000_000;

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

const base = newGame({ seed: 'crop-materials', now: T0 });
const city: GameState = {
  ...base, urbs: 10_000, marketUnlocked: true,
  storage: { materials: { wheat: 4 }, goods: {} },
  buildings: [...base.buildings, { ...createBuilding(base.nextId, 'storehouse', 56, 59, 0) }, { ...createBuilding(base.nextId + 1, 'shop', 30, 30, 0) }],
  nextId: base.nextId + 2,
};

describe('Crop Materials', () => {
  it('has one Material per species, unlocked with it', () => {
    for (const id of CROP_IDS) expect(MATERIALS[id].unlockCitizens).toBeGreaterThan(0);
    expect(MATERIALS.wheat.unlockCitizens).toBe(20);
    expect(MATERIALS.apple.unlockCitizens).toBe(800);
  });

  it('is never produced by a Workshop', () => {
    expect(producibleItems('workshop')).toEqual(['wood', 'stone', 'clay', 'metal', 'silicon', 'sand', 'coal', 'gold']);
    expect(failureKey(city, { type: 'QueueProduction', buildingId: 1, item: 'wheat' })).toBe('error.cannotProduce');
  });

  it('is never an ingredient of a Factory recipe', () => {
    for (const item of producibleItems('factory')) for (const material of Object.keys(GOODS[item as GoodId].recipe)) expect(CROP_IDS).not.toContain(material);
  });

  it('counts toward the crops compartment, apart from other Materials', () => {
    expect(storageUsed({ materials: { wood: 2, wheat: 3 }, goods: {} })).toEqual({ materials: 2, crops: 3, goods: 0 });
  });

  it('is never sold directly to Shops or to the Market', () => {
    expect(failureKey(city, { type: 'StockShop', buildingId: city.buildings.at(-1)!.id, good: 'wheat' as never })).not.toBeNull();
    expect(failureKey(city, { type: 'SellToMarket', good: 'wheat' as never, quantity: 1 })).not.toBeNull();
  });
});
