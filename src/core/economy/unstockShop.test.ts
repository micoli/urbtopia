import { describe, expect, it } from 'vitest';
import { dispatch, newGame, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;

function succeed(state: GameState, command: Command): GameState {
  const result = dispatch(state, command, T0);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function stockedShop(): { state: GameState; shopId: number } {
  let state: GameState = { ...newGame({ seed: 'amber-fox-4821', now: T0 }), urbs: 100_000 };
  state = succeed(state, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 });
  state = succeed(state, { type: 'PlaceBuilding', buildingType: 'shop', x: 58, y: 57 });
  state = { ...state, storage: { materials: {}, goods: { planks: 10 } } };
  const shopId = state.buildings.find((b) => b.type === 'shop')!.id;
  return { state: succeed(state, { type: 'StockShop', buildingId: shopId, good: 'planks' }), shopId };
}

describe('UnstockShop', () => {
  it('returns the unsold units to the Storehouse and empties the slot', () => {
    const { state, shopId } = stockedShop();
    const after = succeed(state, { type: 'UnstockShop', buildingId: shopId, slot: 0 });
    expect(after.storage.goods.planks).toBe(10);
    expect(after.buildings.find((b) => b.id === shopId)!.stacks[0]).toMatchObject({ good: null, stock: 0, nextSaleAt: null });
  });

  it('keeps what the stack already earned', () => {
    const { state, shopId } = stockedShop();
    const earning: GameState = { ...state, buildings: state.buildings.map((b) => (b.id === shopId ? { ...b, stacks: b.stacks.map((s, i) => (i === 0 ? { ...s, stock: 3, earned: 7 } : s)) } : b)) };
    const after = succeed(earning, { type: 'UnstockShop', buildingId: shopId, slot: 0 });
    expect(after.buildings.find((b) => b.id === shopId)!.stacks[0]).toMatchObject({ stock: 0, earned: 7, nextSaleAt: null });
  });

  it('fails on an empty slot', () => {
    const { state, shopId } = stockedShop();
    expect(dispatch(state, { type: 'UnstockShop', buildingId: shopId, slot: 2 }, T0).ok).toBe(false);
  });
});
