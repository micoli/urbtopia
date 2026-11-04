import { describe, expect, it } from 'vitest';
import { LEVELS, SURFACE, UNDERGROUND_LEVELS, isLevel, isUnderground, levelAbove, levelBelow } from './level';
import { newGame } from '..';
import { occupiedTiles } from './occupancy';

describe('Level', () => {
  it('stacks the Surface over Level -1 and Level -2, nothing deeper', () => {
    expect(LEVELS).toEqual([0, -1, -2]);
    expect(UNDERGROUND_LEVELS).toEqual([-1, -2]);
    expect(isLevel(-3)).toBe(false);
    expect(isLevel(1)).toBe(false);
  });

  it('walks up and down the stack', () => {
    expect(levelBelow(SURFACE)).toBe(-1);
    expect(levelBelow(-1)).toBe(-2);
    expect(levelBelow(-2)).toBeNull();
    expect(levelAbove(-2)).toBe(-1);
    expect(levelAbove(SURFACE)).toBeNull();
    expect(isUnderground(-1)).toBe(true);
    expect(isUnderground(SURFACE)).toBe(false);
  });

  it('lets nothing underground occupy a Surface tile, except a Pedestrian access', () => {
    const state = { ...newGame({ seed: 'levels', now: 0 }), walkways: [{ x: 5, y: 5 }], tunnels: [{ x: 6, y: 5, exits: ['W' as const] }], pedestrianAccesses: [{ x: 7, y: 5 }] };
    const occupied = occupiedTiles(state);
    expect(occupied.has('5,5')).toBe(false);
    expect(occupied.has('6,5')).toBe(false);
    expect(occupied.has('7,5')).toBe(true);
  });
});
