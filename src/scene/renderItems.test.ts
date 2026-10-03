import { describe, expect, it } from 'vitest';
import { createBuilding, newGame } from '../core';
import { chunkKeyOf, renderItemsOf } from './renderItems';

describe('renderItemsOf', () => {
  const state = newGame({ seed: 'amber-fox-4821', now: 0 });

  it('centres each building on its footprint', () => {
    const workshop = renderItemsOf(state).find((item) => item.model === 'industrial/building-h');
    expect(workshop).toMatchObject({ x: 55, z: 57, rotation: 2 });
  });

  it('turns a building by quarter turns', () => {
    const rotated = { ...state, roads: [], buildings: [createBuilding(9, 'factory', 10, 20, 1)] };
    expect(renderItemsOf(rotated)).toEqual([{ model: 'industrial/building-b', x: 11, z: 21, rotation: 1 }]);
  });
});

describe('renderItemsOf caching', () => {
  const state = newGame({ seed: 'amber-fox-4821', now: 0 });

  it('reuses the items while buildings and roads are unchanged', () => {
    const items = renderItemsOf(state);
    expect(renderItemsOf({ ...state, urbs: state.urbs + 1 })).toBe(items);
  });

  it('rebuilds the items when the roads change', () => {
    const items = renderItemsOf(state);
    const longer = { ...state, roads: [...state.roads, { x: 63, y: 58, kind: 'road' as const }] };
    expect(renderItemsOf(longer)).not.toBe(items);
  });
});

describe('road items', () => {
  const state = newGame({ seed: 'amber-fox-4821', now: 0 });

  it('uses straight pieces in the middle of a road and an end piece at its extremity', () => {
    const items = renderItemsOf(state).filter((item) => item.model.startsWith('roads/'));
    expect(items.find((item) => item.x === 57.5)).toMatchObject({ model: 'roads/road-straight', rotation: 0 });
    expect(items.find((item) => item.x === 53.5)).toMatchObject({ model: 'roads/road-end', rotation: 0 });
    expect(items.find((item) => item.x === 62.5)).toMatchObject({ model: 'roads/road-end', rotation: 2 });
  });
});

describe('chunkKeyOf', () => {
  it('groups tiles by 16x16 chunks', () => {
    expect(chunkKeyOf(15.5, 0.2)).toBe('0,0');
    expect(chunkKeyOf(16, 31.9)).toBe('1,1');
  });
});
