import { describe, expect, it } from 'vitest';
import { createBuilding, newGame } from '../index';
import { buildingAt } from './buildingAt';

describe('building at a tile', () => {
  const state = { ...newGame({ seed: 'at', now: 0 }), buildings: [createBuilding(7, 'home', 10, 12, 0)] };

  it('finds the building on its anchor tile', () => {
    expect(buildingAt(state, { x: 10, y: 12 })).toBe(7);
  });

  it('finds nothing on a free tile', () => {
    expect(buildingAt(state, { x: 0, y: 0 })).toBeUndefined();
  });
});
