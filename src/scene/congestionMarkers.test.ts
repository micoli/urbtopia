import { describe, expect, it } from 'vitest';
import { newGame, type GameState } from '../core';
import { dividerStrips, tintColor } from './congestionMarkers';

const row = (tier: number): GameState => ({
  ...newGame({ now: 0, seed: 'test' }),
  roads: [1, 2, 3].map((x) => ({ x, y: 5, kind: 'road' as const, tier })),
  roundabouts: [],
});

describe('tintColor', () => {
  it('goes from orange at the limit to red when badly overloaded', () => {
    expect(tintColor(1)).toBe(0xff9f1c);
    expect(tintColor(2)).toBe(0xd62828);
    expect(tintColor(5)).toBe(0xd62828);
  });
});

describe('dividerStrips', () => {
  it('draws no divider on a single-Lane road', () => {
    expect(dividerStrips(row(1))).toEqual([]);
  });

  it('draws Lane borders on both sides of straight multi-Lane tiles only', () => {
    const strips = dividerStrips(row(3));
    expect(strips).toHaveLength(4);
    expect(strips.every((strip) => strip.horizontal && strip.x === 2.5)).toBe(true);
  });
});
