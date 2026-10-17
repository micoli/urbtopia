import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { giveItem } from './giveItem';

describe('giveItem', () => {
  const state = newGame({ seed: 'devtools', now: 1_700_000_000_000 });
  const stocked = { ...state, storage: { materials: { wood: 12 }, goods: { planks: 7 } } };

  it('adds the quantity to one material only', () => {
    const after = giveItem(stocked, 'wood', 50);
    expect(after.storage.materials).toEqual({ wood: 62 });
    expect(after.storage.goods).toEqual({ planks: 7 });
    expect(stocked.storage.materials).toEqual({ wood: 12 });
  });

  it('adds the quantity to one good only, even if absent from the stock', () => {
    const after = giveItem(stocked, 'planks', 5);
    expect(after.storage.goods).toEqual({ planks: 12 });
    expect(giveItem(stocked, 'bricks', 5).storage.goods).toEqual({ planks: 7, bricks: 5 });
    expect(after.storage.materials).toEqual({ wood: 12 });
  });

  it.each([0, -1, 1.5, NaN, 1_000_001])('rejects invalid quantity %s', (quantity) => {
    expect(giveItem(stocked, 'wood', quantity)).toBe(stocked);
  });
});
