import { describe, expect, it } from 'vitest';
import type { Hex } from './hex';
import type { PlacedHex } from './districtScore';
import { matchingSeams, seamsAround } from './districtSeams';

const uniform = (category: Hex['edges'][number]): Hex => ({ edges: [category, category, category, category, category, category] });
const placed = (q: number, r: number, hex: Hex): PlacedHex => ({ cell: { q, r }, hex });

describe('the seams where edges coincide', () => {
  it('has none for an empty board and for a single Hex', () => {
    expect(matchingSeams([])).toEqual([]);
    expect(matchingSeams([placed(0, 0, uniform('park'))])).toEqual([]);
  });

  it('has one seam for two touching Hexes of the same category, once whatever the order', () => {
    const board = [placed(0, 0, uniform('park')), placed(1, 0, uniform('park'))];
    expect(matchingSeams(board)).toEqual([{ cell: { q: 0, r: 0 }, edge: 0 }]);
    expect(matchingSeams([...board].reverse())).toEqual([{ cell: { q: 0, r: 0 }, edge: 0 }]);
  });

  it('has none for touching edges of different categories', () => {
    expect(matchingSeams([placed(0, 0, uniform('park')), placed(1, 0, uniform('water'))])).toEqual([]);
  });

  it('has none for Hexes that do not touch', () => {
    expect(matchingSeams([placed(0, 0, uniform('park')), placed(2, 0, uniform('park'))])).toEqual([]);
  });

  it('only looks at the edges that face each other', () => {
    const west: Hex = { edges: ['park', 'water', 'water', 'water', 'water', 'water'] };
    const east: Hex = { edges: ['habitat', 'habitat', 'habitat', 'park', 'habitat', 'habitat'] };
    expect(matchingSeams([placed(0, 0, west), placed(1, 0, east)])).toHaveLength(1);
    const turned: Hex = { edges: ['habitat', 'habitat', 'habitat', 'habitat', 'park', 'habitat'] };
    expect(matchingSeams([placed(0, 0, west), placed(1, 0, turned)])).toEqual([]);
  });

  it('counts a seam for each coinciding edge of a Hex among six neighbours', () => {
    const centre = placed(0, 0, uniform('habitat'));
    const ring = [placed(1, 0, uniform('habitat')), placed(1, -1, uniform('park')), placed(0, -1, uniform('habitat')), placed(-1, 0, uniform('water')), placed(-1, 1, uniform('habitat')), placed(0, 1, uniform('service'))];
    expect(matchingSeams([centre, ...ring])).toHaveLength(3 + matchingSeams(ring).length);
  });
});

describe('the seams around a Hex', () => {
  it('keeps those where the Hex is on either side', () => {
    const board = [placed(0, 0, uniform('park')), placed(1, 0, uniform('park')), placed(5, 5, uniform('park')), placed(6, 5, uniform('park'))];
    const seams = matchingSeams(board);
    expect(seamsAround(seams, { q: 1, r: 0 })).toEqual([{ cell: { q: 0, r: 0 }, edge: 0 }]);
    expect(seamsAround(seams, { q: 0, r: 0 })).toEqual([{ cell: { q: 0, r: 0 }, edge: 0 }]);
    expect(seamsAround(seams, { q: 9, r: 9 })).toEqual([]);
  });
});
