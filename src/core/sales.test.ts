import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { advance, dispatch, marketPoints, newGame, type Command, type GameState } from './index';

const T0 = 1_700_000_000_000;
const SECOND = 1000;
const MINUTE = 60 * SECOND;

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function failureKey(state: GameState, command: Command, now = T0): string | null {
  const result = dispatch(state, command, now);
  return result.ok ? null : result.error.key;
}

const initial = newGame({ seed: 'amber-fox-4821', now: T0 });
const withShop = succeed({ ...initial, urbs: 10_000 }, { type: 'PlaceBuilding', buildingType: 'shop', x: 56, y: 57 });
const SHOP_ID = withShop.buildings.find((b) => b.type === 'shop')?.id ?? 0;
const stocked: GameState = { ...withShop, storage: { materials: {}, goods: { planks: 12, bricks: 12 } }, marketUnlocked: true };
const stack = (state: GameState, index = 0) => state.buildings.find((b) => b.id === SHOP_ID)?.stacks[index];
const stockShop = (good: 'planks' | 'bricks'): Command => ({ type: 'StockShop', buildingId: SHOP_ID, good });

describe('Shop', () => {
  it('has 3 Slots from the start', () => {
    expect(stack(withShop, 2)).toBeDefined();
    expect(stack(withShop, 3)).toBeUndefined();
  });

  it('takes a stack of 5 units from the Storehouse and starts selling after 45 s', () => {
    const state = succeed(stocked, stockShop('planks'));
    expect(state.storage.goods.planks).toBe(7);
    expect(stack(state)).toEqual({ good: 'planks', stock: 5, nextSaleAt: T0 + 45 * SECOND, earned: 0 });
  });

  it('fills the next free Slot and refuses when all Slots are busy', () => {
    let state = stocked;
    state = succeed(state, stockShop('planks'));
    state = succeed(state, stockShop('bricks'));
    expect(stack(state, 1)?.good).toBe('bricks');
    const rich: GameState = { ...state, storage: { materials: {}, goods: { planks: 40 } } };
    const full = succeed(rich, stockShop('planks'));
    expect(failureKey(full, stockShop('planks'))).toBe('error.queueFull');
  });

  it('refuses without enough Goods or for a building that is not a Shop', () => {
    expect(failureKey({ ...stocked, storage: { materials: {}, goods: { planks: 4 } } }, stockShop('planks'))).toBe('error.missingGoods');
    expect(failureKey(stocked, { type: 'StockShop', buildingId: 1, good: 'planks' })).toBe('error.notAShop');
  });

  it('sells one unit every 45 s at full value and keeps the Urbs in the Shop', () => {
    const state = succeed(stocked, stockShop('planks'));
    expect(stack(advance(state, T0 + 44 * SECOND).state)).toMatchObject({ stock: 5, earned: 0 });
    expect(stack(advance(state, T0 + 45 * SECOND).state)).toMatchObject({ stock: 4, earned: 14, nextSaleAt: T0 + 90 * SECOND });
    expect(stack(advance(state, T0 + 10 * MINUTE).state)).toMatchObject({ stock: 0, earned: 70, nextSaleAt: null });
  });

  it('does not store more than the value of one stack per Slot', () => {
    const sold = advance(succeed(stocked, stockShop('planks')), T0 + 10 * MINUTE).state;
    const restocked = succeed(sold, stockShop('planks'), T0 + 10 * MINUTE);
    expect(stack(advance(restocked, T0 + 30 * MINUTE).state)?.earned).toBe(70);
  });

  it('pays the earned Urbs when collected', () => {
    const sold = advance(succeed(stocked, stockShop('bricks')), T0 + 5 * MINUTE).state;
    const before = sold.urbs;
    const collected = succeed(sold, { type: 'Collect', buildingId: SHOP_ID }, T0 + 5 * MINUTE);
    expect(collected.urbs).toBe(before + 5 * 34);
    expect(stack(collected)?.earned).toBe(0);
    expect(failureKey(collected, { type: 'Collect', buildingId: SHOP_ID }, T0 + 5 * MINUTE)).toBe('error.nothingToCollect');
  });

  it('can get more Slots, the 4th costing 1,500 Urbs', () => {
    const state = succeed(stocked, { type: 'BuySlot', buildingId: SHOP_ID });
    expect(stack(state, 3)).toBeDefined();
    expect(state.urbs).toBe(stocked.urbs - 1500);
  });

  it('gives the same state whether time is advanced in steps or at once', () => {
    const state = succeed(succeed(stocked, stockShop('planks')), stockShop('bricks'));
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 30 * MINUTE }), fc.integer({ min: 0, max: 30 * MINUTE }), (a, b) => {
        const [first, second] = [T0 + Math.min(a, b), T0 + Math.max(a, b)];
        expect(advance(advance(state, first).state, second).state).toEqual(advance(state, second).state);
      }),
    );
  });
});

describe('Market', () => {
  const sell = (good: 'planks' | 'bricks', quantity: number): Command => ({ type: 'SellToMarket', good, quantity });

  it('stays locked until the first Good is collected', () => {
    const locked: GameState = { ...stocked, marketUnlocked: false };
    expect(failureKey(locked, sell('planks', 1))).toBe('error.marketLocked');
  });

  it('unlocks when the first Good reaches the Storehouse', () => {
    const base = succeed({ ...initial, urbs: 10_000 }, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 });
    const queued = succeed({ ...base, storage: { materials: { wood: 2 }, goods: {} } }, { type: 'QueueProduction', buildingId: 2, item: 'planks' });
    const ready = advance(queued, T0 + 2 * MINUTE).state;
    expect(ready.marketUnlocked).toBe(false);
    expect(succeed(ready, { type: 'Collect', buildingId: 2 }, T0 + 2 * MINUTE).marketUnlocked).toBe(true);
  });

  it('pays 60 % of the value for the first unit, then 5 points less for each next unit', () => {
    const state = succeed(stocked, sell('planks', 2));
    expect(state.urbs - stocked.urbs).toBe(16);
    expect(state.storage.goods.planks).toBe(10);
    expect(marketPoints(state, 'planks', T0)).toBe(50);
  });

  it('never pays less than 30 % of the value', () => {
    const state = succeed({ ...stocked, storage: { materials: {}, goods: { bricks: 8 } } }, sell('bricks', 8));
    expect(state.urbs - stocked.urbs).toBe(117);
    expect(marketPoints(state, 'bricks', T0)).toBe(30);
  });

  it('prices each Good on its own', () => {
    const state = succeed(stocked, sell('planks', 3));
    expect(marketPoints(state, 'bricks', T0)).toBe(60);
  });

  it('recovers linearly, from the floor to the full price in one hour', () => {
    const state = succeed({ ...stocked, storage: { materials: {}, goods: { bricks: 8 } } }, sell('bricks', 8));
    expect(marketPoints(state, 'bricks', T0 + 30 * MINUTE)).toBe(45);
    expect(marketPoints(state, 'bricks', T0 + 60 * MINUTE)).toBe(60);
    expect(marketPoints(state, 'bricks', T0 + 5 * 60 * MINUTE)).toBe(60);
  });

  it('starts from the recovered price on the next sale', () => {
    const first = succeed(stocked, sell('planks', 2));
    const later = succeed(first, sell('planks', 1), T0 + 10 * MINUTE);
    expect(later.urbs - first.urbs).toBe(Math.floor((14 * 55) / 100));
  });

  it('refuses to sell Goods that are not in the Storehouse or a bad quantity', () => {
    expect(failureKey(stocked, sell('planks', 13))).toBe('error.missingGoods');
    expect(failureKey(stocked, sell('planks', 0))).toBe('error.invalidQuantity');
  });
});
