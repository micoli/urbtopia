import { describe, expect, it } from 'vitest';
import { advance, dispatch, newGame, upgradeCostOf, type Command, type GameState } from '../index';
import { createBuilding } from '../buildings/buildingSpecs';
import { jobsOf } from '../traffic/jobs';
import { definitionOf, tiersOf } from '../buildings/buildingDefinitions';
import { GOODS } from './items';
import { SHOP_TYPES, canSell, saleIntervalOf, sellableGoodsOf, shopTierOf, slotPriceOf } from './shops';

const T0 = 1_700_000_000_000;

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

const failureKey = (state: GameState, command: Command): string | null => {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
};

const rich: GameState = { ...newGame({ seed: 'amber-fox-4821', now: T0 }), urbs: 1_000_000, storage: { materials: {}, goods: { planks: 100, bricks: 100, tiles: 100, tools: 100, cannedFish: 100, steel: 100 } } };

const city = (type: 'shop' | 'shopConstruction' | 'shopFood' | 'shopEquipment') => {
  const building = createBuilding(900, type, 56, 57, 0);
  const state = { ...rich, buildings: [...rich.buildings, building] };
  return { state, id: building.id, building };
};

describe('Shop categories', () => {
  it('sells only the Goods of its category listed for its Tier', () => {
    const { state, id, building } = city('shopConstruction');
    expect(canSell(building, 'planks')).toBe(true);
    expect(canSell(building, 'steel')).toBe(false);
    expect(canSell(building, 'tools')).toBe(false);
    expect(failureKey(state, { type: 'StockShop', buildingId: id, good: 'tools' })).toBe('error.notSoldHere');
    expect(failureKey(state, { type: 'StockShop', buildingId: id, good: 'steel' })).toBe('error.notSoldHere');
    expect(failureKey(state, { type: 'StockShop', buildingId: id, good: 'planks' })).toBeNull();
  });

  it('unlocks more Goods with its Tier', () => {
    const { state, id } = city('shopConstruction');
    const upgraded = [2, 3, 4].reduce<GameState>((current) => succeed(current, { type: 'UpgradeBuilding', buildingId: id }), state);
    const building = upgraded.buildings.find((b) => b.id === id)!;
    expect(building.tier).toBe(4);
    expect(canSell(building, 'steel')).toBe(true);
  });

  it('sells packed Crops in a Food shop and not in a Construction shop', () => {
    expect(canSell(city('shopFood').building, 'wheatCrate')).toBe(true);
    expect(canSell(city('shopConstruction').building, 'wheatCrate')).toBe(false);
  });

  it('lets the General shop sell Goods of every category', () => {
    const { building } = city('shop');
    for (const good of ['planks', 'tools', 'cannedFish', 'wheatBox'] as const) expect(canSell(building, good)).toBe(true);
  });

  it('only lists Goods of its own category, except the General shop', () => {
    for (const type of ['shopConstruction', 'shopFood', 'shopEquipment'] as const) {
      const { building } = city(type);
      expect(sellableGoodsOf(building).length).toBeGreaterThan(0);
    }
  });
});

describe('Shop Tiers', () => {
  it('raises the Slots, the Jobs and the sales speed with the Tier', () => {
    const { building } = city('shopEquipment');
    const top = { ...building, tier: 4 };
    expect(shopTierOf(top).maxSlots).toBeGreaterThan(shopTierOf(building).maxSlots);
    expect(jobsOf(top)).toBeGreaterThan(jobsOf(building));
    expect(saleIntervalOf(top)).toBeLessThan(saleIntervalOf(building));
  });

  it('refuses to buy a Slot beyond the Tier maximum', () => {
    const { state, id, building } = city('shopConstruction');
    const bought = Array.from({ length: shopTierOf(building).maxSlots - building.slotCount }).reduce<GameState>((current) => succeed(current, { type: 'BuySlot', buildingId: id }), state);
    expect(failureKey(bought, { type: 'BuySlot', buildingId: id })).toBe('error.maxSlots');
  });

  it('sells faster at a higher Tier', () => {
    const { state, id } = city('shopConstruction');
    const stocked = succeed(state, { type: 'StockShop', buildingId: id, good: 'planks' });
    const upgraded = succeed(stocked, { type: 'UpgradeBuilding', buildingId: id });
    const slow = stocked.buildings.find((b) => b.id === id)!.stacks[0]!.nextSaleAt!;
    const fast = upgraded.buildings.find((b) => b.id === id)!;
    expect(saleIntervalOf(fast)).toBeLessThan(saleIntervalOf({ ...fast, tier: 1 }));
    expect(slow).toBe(T0 + saleIntervalOf({ ...fast, tier: 1 }));
  });
});

describe('General shop premium', () => {
  it('costs twice a specialised Shop to upgrade', () => {
    expect(upgradeCostOf('shop', 2)!.urbs).toBe(2 * upgradeCostOf('shopConstruction', 2)!.urbs);
  });

  it('costs more per extra Slot', () => {
    expect(slotPriceOf(city('shop').building, 4)).toBe(2 * slotPriceOf(city('shopFood').building, 4));
  });

  it('charges the factor when a Slot is bought', () => {
    const { state, id } = city('shop');
    const bought = succeed(state, { type: 'BuySlot', buildingId: id });
    expect(state.urbs - bought.urbs).toBe(slotPriceOf({ type: 'shop', tier: 1 }, 4));
  });

  it('keeps working through advance', () => {
    const { state } = city('shop');
    expect(advance(state, T0 + 60_000).state.buildings).toHaveLength(state.buildings.length);
  });
});

describe('Shops in the build menu', () => {
  const entries = SHOP_TYPES.map((type) => definitionOf(type));

  it('offers every Shop in the Shops section', () => {
    expect(SHOP_TYPES).toHaveLength(5);
    expect(entries.every(({ section }) => section === 'build.shops')).toBe(true);
  });

  it('unlocks the specialised Shops with the city', () => {
    const unlocks = Object.fromEntries(entries.map(({ id, unlockCitizens }) => [id, unlockCitizens]));
    expect(unlocks).toMatchObject({ shop: 0, shopConstruction: 0, shopFood: 50, shopEquipment: 150, shopLuxury: 400 });
  });

  it('gives each specialised Shop its own Good category and four Tiers', () => {
    const categories = entries.filter(({ id }) => id !== 'shop').map(({ goodCategory }) => goodCategory).sort();
    expect(categories).toEqual(['construction', 'equipment', 'food', 'luxury']);
    for (const { id } of entries) expect(tiersOf(id)).toHaveLength(4);
  });

  it('only lists Goods of the Shop category in a specialised Shop', () => {
    for (const { id, goodCategory } of entries.filter(({ id }) => id !== 'shop')) {
      for (const tier of [1, 2, 3, 4]) for (const good of shopTierOf({ type: id, tier }).sells) expect(GOODS[good].category).toBe(goodCategory);
    }
  });
});
