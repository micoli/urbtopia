import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { advance, createBuilding, newGame, shopTierOf, type GameState } from '../core';
import { parseEnvelope, serializeEnvelope } from './envelope';

const T0 = 1_700_000_000_000;

const load = (state: GameState): GameState => {
  const result = parseEnvelope(serializeEnvelope(state, T0));
  if (!result.ok) throw new Error(result.reason);
  return result.state;
};

describe('Shop save', () => {
  const legacyShop = {
    ...createBuilding(1, 'shop', 56, 57, 2),
    slotCount: 5,
    stacks: [
      { good: 'tiles' as const, stock: 5, nextSaleAt: T0 + 1000, earned: 0 },
      { good: 'planks' as const, stock: 2, nextSaleAt: T0 + 2000, earned: 7 },
      { good: null, stock: 0, nextSaleAt: null, earned: 0 },
      { good: null, stock: 0, nextSaleAt: null, earned: 0 },
      { good: null, stock: 0, nextSaleAt: null, earned: 0 },
    ],
  };
  const city: GameState = { ...newGame({ seed: 'shop-save', now: T0 }), tutorial: null, buildings: [legacyShop] };

  it('loads a Shop saved before the categories as the General shop at Tier 1, stacks and Slots intact', () => {
    const [shop] = load(city).buildings;
    expect(shop).toMatchObject({ type: 'shop', tier: 1, slotCount: 5 });
    expect(shop!.stacks).toEqual(legacyShop.stacks);
    expect(shopTierOf(shop!).maxSlots).toBeGreaterThanOrEqual(shop!.slotCount);
  });

  it('keeps selling a stacked Good the Tier no longer lists', () => {
    const loaded = load(city);
    const sold = advance(loaded, T0 + 5000).state.buildings[0]!;
    expect(sold.stacks[0]!.stock).toBeLessThan(5);
    expect(sold.stacks[0]!.earned).toBeGreaterThan(0);
  });

  it('keeps the Tier and stacks of a specialised Shop', () => {
    const shop = { ...createBuilding(2, 'shopFood', 56, 57, 2), tier: 3, stacks: [{ good: 'cannedFish' as const, stock: 4, nextSaleAt: T0 + 9000, earned: 3 }, ...createBuilding(2, 'shopFood', 0, 0, 0).stacks.slice(1)] };
    const [loaded] = load({ ...city, buildings: [shop] }).buildings;
    expect(loaded).toMatchObject({ type: 'shopFood', tier: 3 });
    expect(loaded!.stacks[0]).toEqual(shop.stacks[0]);
  });

  it('loads a frozen version-12 save that holds a Shop', () => {
    const frozen = JSON.parse(readFileSync(new URL('./fixtures/save-v12.json', import.meta.url), 'utf8'));
    frozen.state.buildings.push({ ...legacyShop, id: frozen.state.nextId });
    frozen.state.nextId += 1;
    const result = parseEnvelope(JSON.stringify(frozen));
    if (!result.ok) throw new Error(result.reason);
    expect(result.state.buildings.find((b) => b.type === 'shop')).toMatchObject({ tier: 1, slotCount: 5 });
  });
});
