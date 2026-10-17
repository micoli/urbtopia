import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { clearGoods, clearMaterials, clearWarehouse } from './clearItems';

describe('clearItems', () => {
  const state = newGame({ seed: 'devtools', now: 1_700_000_000_000 });
  const stocked = { ...state, storage: { materials: { wood: 12, stone: 3 }, goods: { planks: 7 } } };

  it('clears every material and keeps the goods', () => {
    const after = clearMaterials(stocked);
    expect(after.storage.materials).toEqual({});
    expect(after.storage.goods).toEqual({ planks: 7 });
    expect(after.buildings).toBe(stocked.buildings);
    expect(after.urbs).toBe(stocked.urbs);
  });

  it('clears every good and keeps the materials', () => {
    const after = clearGoods(stocked);
    expect(after.storage.goods).toEqual({});
    expect(after.storage.materials).toEqual({ wood: 12, stone: 3 });
    expect(stocked.storage.goods).toEqual({ planks: 7 });
  });

  it('clears the whole warehouse', () => {
    const after = clearWarehouse(stocked);
    expect(after.storage).toEqual({ materials: {}, goods: {} });
    expect(after.buildings).toBe(stocked.buildings);
    expect(after.urbs).toBe(stocked.urbs);
  });
});
