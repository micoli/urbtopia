import { describe, expect, it } from 'vitest';
import { newGame, type GameState } from '../core';
import { congestionTints, dividerStrips, tintColor } from './congestionMarkers';
import type { CongestionStats } from '../core';

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

describe('congestionTints', () => {
  const statsOf = (ratios: number[], saturatedCrossing = false) =>
    ({
      sections: new Map(ratios.map((ratio, x) => [`${x},0`, { tile: { x, y: 0 }, load: ratio, capacity: 1, ratio }])),
      crossings: new Map(saturatedCrossing ? [['0,0', { tile: { x: 0, y: 0 }, pedestrians: 1, cut: 1, saturated: true }]] : []),
    }) as unknown as CongestionStats;

  it('tints only saturated tiles, in a few steps', () => {
    const tints = congestionTints(statsOf([0.5, 1.1, 1.2, 3]));
    expect(tints.has('0,0')).toBe(false);
    expect(tints.get('1,0')).toBe(tints.get('2,0'));
    expect(tints.get('3,0')).toBe(0xd62828);
  });

  it('gives a saturated crossing its own colour', () => {
    expect(congestionTints(statsOf([2], true)).get('0,0')).toBe(0x3a86ff);
  });
});
