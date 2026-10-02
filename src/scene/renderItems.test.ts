import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { chunkKeyOf, renderItemsOf } from './renderItems';

describe('renderItemsOf', () => {
  const state = newGame({ seed: 'amber-fox-4821', now: 0 });

  it('centres each building on its footprint', () => {
    const workshop = renderItemsOf(state).find((item) => item.model === 'industrial/building-h');
    expect(workshop).toMatchObject({ x: 55, z: 57, rotation: 0 });
  });

  it('turns a building by quarter turns', () => {
    const rotated = { ...state, buildings: [{ id: 9, type: 'factory' as const, x: 10, y: 20, rotation: 1 as const }] };
    expect(renderItemsOf(rotated)).toEqual([{ model: 'industrial/building-b', x: 11, z: 21, rotation: 1 }]);
  });
});

describe('chunkKeyOf', () => {
  it('groups tiles by 16x16 chunks', () => {
    expect(chunkKeyOf(15.5, 0.2)).toBe('0,0');
    expect(chunkKeyOf(16, 31.9)).toBe('1,1');
  });
});
