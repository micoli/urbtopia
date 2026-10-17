import { describe, expect, it } from 'vitest';
import { GOODS, MATERIALS, newGame } from '../core';
import { giveAllItems } from './giveAllItems';

describe('giveAllItems', () => {
  const state = newGame({ seed: 'devtools', now: 1_700_000_000_000 });

  it('adds every item including locked goods and crops while preserving existing stock', () => {
    const before = { ...state, storage: { materials: { wood: 12 }, goods: { planks: 7 } } };
    const after = giveAllItems(before, 1000);
    expect(Object.keys(after.storage.materials).sort()).toEqual(Object.keys(MATERIALS).sort());
    expect(Object.keys(after.storage.goods).sort()).toEqual(Object.keys(GOODS).sort());
    expect(Object.values(after.storage.materials).every((quantity) => quantity >= 1000)).toBe(true);
    expect(Object.values(after.storage.goods).every((quantity) => quantity >= 1000)).toBe(true);
    expect(after.storage.materials.wood).toBe(1012);
    expect(after.storage.goods.planks).toBe(1007);
    expect(before.storage.materials.wood).toBe(12);
    expect(after.buildings).toBe(before.buildings);
    expect(after.urbs).toBe(before.urbs);
  });

  it.each([0, -1, 1.5, NaN, Infinity, 1_000_001])('rejects invalid quantity %s', (quantity) => {
    expect(giveAllItems(state, quantity)).toBe(state);
  });
});
