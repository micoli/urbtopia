import { describe, expect, it } from 'vitest';
import { advance, dispatch, newGame, type Command, type GameState } from '../index';
import { createBuilding } from '../buildings/buildingSpecs';
import { canSell, saleIntervalOf, sellableGoodsOf } from './shops';

const T0 = 1_700_000_000_000;
const SECOND = 1000;

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

const failureKey = (state: GameState, command: Command): string | null => {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
};

const bakery = createBuilding(900, 'bakery', 56, 57, 0);
const base = newGame({ seed: 'bakery-counter', now: T0 });
const city: GameState = { ...base, urbs: 100_000, marketUnlocked: true, storage: { materials: {}, goods: { bread: 12, fougasse: 5, planks: 5 } }, buildings: [...base.buildings, bakery] };
const stack = (state: GameState, index = 0) => state.buildings.find((building) => building.id === bakery.id)!.stacks[index];

describe('Bakery counter', () => {
  it('opens with 3 sales Slots next to its 2 production Slots', () => {
    expect(bakery.stacks).toHaveLength(3);
    expect(bakery.slotCount).toBe(2);
  });

  it('sells only the baked Goods', () => {
    expect(sellableGoodsOf(bakery)).toEqual(['bread', 'fougasse', 'appleCake', 'cherryClafoutis']);
    expect(canSell(bakery, 'bread')).toBe(true);
    expect(canSell(bakery, 'planks')).toBe(false);
    expect(canSell(bakery, 'wheatCrate')).toBe(false);
    expect(saleIntervalOf(bakery)).toBe(45 * SECOND);
  });

  it('stocks a baked Good and refuses another', () => {
    const state = succeed(city, { type: 'StockShop', buildingId: bakery.id, good: 'bread' });
    expect(state.storage.goods.bread).toBe(7);
    expect(stack(state)).toEqual({ good: 'bread', stock: 5, nextSaleAt: T0 + 45 * SECOND, earned: 0 });
    expect(failureKey(city, { type: 'StockShop', buildingId: bakery.id, good: 'planks' })).toBe('error.notSoldHere');
  });

  it('sells the stack and pays the earnings on Collect', () => {
    const stocked = succeed(city, { type: 'StockShop', buildingId: bakery.id, good: 'bread' });
    const sold = advance(stocked, T0 + 50 * SECOND).state;
    expect(stack(sold)!.earned).toBeGreaterThan(0);
    const paid = succeed(sold, { type: 'Collect', buildingId: bakery.id }, T0 + 50 * SECOND);
    expect(paid.urbs).toBeGreaterThan(sold.urbs);
    expect(stack(paid)!.earned).toBe(0);
  });

  it('collects the finished production, with or without earnings to pay', () => {
    const storehouse: GameState = { ...city, buildings: [...city.buildings, createBuilding(901, 'storehouse', 50, 50, 0)] };
    const done = { item: 'bread' as const, duration: 1, startedAt: T0, done: true, quantity: 2 };
    const withBread = (state: GameState, earned: number): GameState => ({
      ...state,
      buildings: state.buildings.map((building) => (building.id === bakery.id ? { ...building, queue: [done], stacks: building.stacks.map((s, i) => (i === 0 ? { ...s, earned } : s)) } : building)),
    });
    const breadOnly = succeed(withBread(storehouse, 0), { type: 'Collect', buildingId: bakery.id });
    expect(breadOnly.storage.goods.bread).toBe(14);
    const both = succeed(withBread(storehouse, 30), { type: 'Collect', buildingId: bakery.id });
    expect(both.storage.goods.bread).toBe(14);
    expect(both.urbs).toBe(storehouse.urbs + 30);
    expect(stack(both)!.earned).toBe(0);
  });

  it('pads the stacks of a bakery saved before it had a counter', () => {
    const legacy: GameState = { ...city, buildings: [...base.buildings, { ...bakery, stacks: [] }] };
    const state = succeed(legacy, { type: 'StockShop', buildingId: bakery.id, good: 'fougasse' });
    expect(state.buildings.find((building) => building.id === bakery.id)!.stacks).toHaveLength(3);
    expect(stack(state)!.good).toBe('fougasse');
  });

  it('keeps production Slots and sales Slots apart', () => {
    const stocked = succeed(city, { type: 'StockShop', buildingId: bakery.id, good: 'bread' });
    const upgraded = stocked.buildings.find((building) => building.id === bakery.id)!;
    expect(upgraded.slotCount).toBe(2);
    expect(failureKey(city, { type: 'BuySlot', buildingId: bakery.id })).toBeNull();
  });
});
