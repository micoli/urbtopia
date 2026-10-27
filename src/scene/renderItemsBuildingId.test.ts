import { describe, expect, it } from 'vitest';
import { createBuilding, newGame } from '../core';
import { renderItemsOf } from './renderItems';

describe('render items of a building', () => {
  it('carry the id of their building, so a power cut can darken its windows', () => {
    const base = newGame({ seed: 'render-ids', now: 0 });
    const state = { ...base, buildings: [createBuilding(7, 'home', 50, 50, 0), createBuilding(8, 'solar', 60, 60, 0)] };
    const owned = renderItemsOf(state).filter(item => item.buildingId !== undefined);
    expect(new Set(owned.map(item => item.buildingId))).toEqual(new Set([7, 8]));
  });

  it('leave roads and fields without a building id', () => {
    const base = newGame({ seed: 'render-ids-roads', now: 0 });
    const state = { ...base, buildings: [], roads: [{ x: 50, y: 50, kind: 'road' as const }] };
    expect(renderItemsOf(state).every(item => item.buildingId === undefined)).toBe(true);
  });
});
