import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Command, type GameState } from '../index';
import { GOODS, isGood, producibleItems } from './items';
import { canSell } from './shops';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

const failureKey = (state: GameState, command: Command): string | null => {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
};

const homes = Array.from({ length: 175 }, (_, index) => ({ ...createBuilding(100 + index, 'home', 44 + (index % 40), 60 + Math.floor(index / 40) * 2, 0), tier: 4 }));
const base = newGame({ seed: 'animal-goods-sales', now: T0 });
const packhouse = createBuilding(900, 'packhouse', 56, 57, 0);
const city = (materials: Record<string, number>, goods: Record<string, number> = {}): GameState => ({
  ...base,
  marketUnlocked: true,
  buildings: [...base.buildings, ...homes, packhouse, createBuilding(901, 'storehouse', 50, 50, 0)],
  storage: { materials, goods },
});

describe('Packhouse and the raw animal Materials', () => {
  it.each(['henEgg', 'duckEgg', 'milk', 'honey'])('packs %s into crates, boxes and pallets of Food', (material) => {
    for (const suffix of ['Crate', 'Box', 'Pallet']) expect(GOODS[`${material}${suffix}` as 'henEggCrate']).toMatchObject({ category: 'food' });
    expect(producibleItems('packhouse')).toContain(`${material}Crate`);
  });

  it('turns two eggs into a crate', () => {
    const queued = succeed(city({ henEgg: 2 }), { type: 'QueueProduction', buildingId: packhouse.id, item: 'henEggCrate' });
    const done = advance(queued, T0 + 30 * MINUTE).state;
    expect(succeed(done, { type: 'Collect', buildingId: packhouse.id }, T0 + 30 * MINUTE).storage.goods.henEggCrate).toBe(1);
  });

  it.each(['wool', 'goatMilk', 'alpacaWool', 'silk', 'mulberryLeaf', 'textile'])('does not pack %s', (material) => {
    expect(producibleItems('packhouse')).not.toContain(`${material}Crate`);
    expect(isGood(`${material}Crate`)).toBe(false);
  });
});

describe('Shops and the new Goods', () => {
  const at = (type: 'shopFood' | 'shopEquipment' | 'shopLuxury' | 'shop', tier: number) => ({ type, tier });

  it('sells dairy in the Grocery from Tier 2, goat cheese from Tier 3', () => {
    expect(canSell(at('shopFood', 1), 'cream')).toBe(false);
    expect(canSell(at('shopFood', 2), 'cream')).toBe(true);
    expect(canSell(at('shopFood', 2), 'goatCheese')).toBe(false);
    expect(canSell(at('shopFood', 3), 'goatCheese')).toBe(true);
  });

  it('sells clothing in the Equipment shop and Scarves in the Luxury shop', () => {
    expect(canSell(at('shopEquipment', 2), 'gloves')).toBe(true);
    expect(canSell(at('shopEquipment', 3), 'sweater')).toBe(true);
    expect(canSell(at('shopEquipment', 4), 'alpacaSweater')).toBe(true);
    expect(canSell(at('shopEquipment', 4), 'scarf')).toBe(false);
    expect(canSell(at('shopLuxury', 3), 'scarf')).toBe(true);
  });

  it('sells all of them in the General shop at its top Tier', () => {
    for (const good of ['cream', 'cheese', 'goatCheese', 'sweater', 'gloves', 'hat', 'alpacaSweater', 'scarf'] as const) expect(canSell(at('shop', 4), good)).toBe(true);
  });
});

describe('Market and the new Goods', () => {
  it('buys Cheese and Sweaters', () => {
    const sold = succeed(city({}, { cheese: 2, sweater: 1 }), { type: 'SellToMarket', good: 'cheese', quantity: 2 });
    expect(sold.urbs).toBeGreaterThan(base.urbs);
    expect(succeed(sold, { type: 'SellToMarket', good: 'sweater', quantity: 1 }).storage.goods.sweater).toBe(0);
  });

  it('does not buy mulberry leaves: they are no Good', () => {
    expect(failureKey(city({ mulberryLeaf: 3 }), { type: 'SellToMarket', good: 'mulberryLeaf' as 'cheese', quantity: 1 })).not.toBeNull();
  });
});
