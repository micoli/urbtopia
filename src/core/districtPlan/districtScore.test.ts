import { describe, expect, it } from 'vitest';
import type { Hex } from './hex';
import { HEX_CATEGORIES, type HexCategory } from './districtPlanVocabulary';
import { pairScoreOf, scoreOf, type PlacedHex } from './districtScore';

const uniform = (category: HexCategory): Hex => ({ edges: [category, category, category, category, category, category] });

const placed = (q: number, r: number, hex: Hex): PlacedHex => ({ cell: { q, r }, hex });

describe('the score of a pair of edges', () => {
  it.each([
    { a: 'habitat', b: 'park', score: 3 },
    { a: 'habitat', b: 'service', score: 2 },
    { a: 'habitat', b: 'commerce', score: 1 },
    { a: 'habitat', b: 'industry', score: -2 },
    { a: 'park', b: 'water', score: 2 },
    { a: 'commerce', b: 'service', score: 1 },
    { a: 'industry', b: 'water', score: -1 },
    { a: 'park', b: 'commerce', score: 0 },
    { a: 'water', b: 'service', score: 0 },
  ] as const)('gives $score to $a with $b, in both orders', ({ a, b, score }) => {
    expect(pairScoreOf(a, b)).toBe(score);
    expect(pairScoreOf(b, a)).toBe(score);
  });

  it.each(HEX_CATEGORIES)('gives +1 to two edges of %s', category => {
    expect(pairScoreOf(category, category)).toBe(1);
  });
});

describe('the score of a board', () => {
  it('is 0 for an empty board and for a single Hex', () => {
    expect(scoreOf([])).toBe(0);
    expect(scoreOf([placed(0, 0, uniform('habitat'))])).toBe(0);
  });

  it('counts the one pair of two touching Hexes once', () => {
    expect(scoreOf([placed(0, 0, uniform('habitat')), placed(1, 0, uniform('park'))])).toBe(3);
  });

  it('does not depend on the order the Hexes are listed in', () => {
    const board = [placed(0, 0, uniform('habitat')), placed(1, 0, uniform('park')), placed(0, 1, uniform('industry'))];
    expect(scoreOf([...board].reverse())).toBe(scoreOf(board));
  });

  it('counts nothing for Hexes that do not touch', () => {
    expect(scoreOf([placed(0, 0, uniform('habitat')), placed(2, 0, uniform('park'))])).toBe(0);
  });

  it('counts only the edges that face each other', () => {
    const west: Hex = { edges: ['park', 'habitat', 'habitat', 'habitat', 'habitat', 'habitat'] };
    const east: Hex = { edges: ['habitat', 'habitat', 'habitat', 'water', 'habitat', 'habitat'] };
    // Edge 0 of the Hex at (0,0) faces edge 3 of the Hex at (1,0): park against water.
    expect(scoreOf([placed(0, 0, west), placed(1, 0, east)])).toBe(2);
  });

  it('adds the pairs along every shared edge of a Hex surrounded by six others', () => {
    const centre = placed(0, 0, uniform('habitat'));
    const ring = [placed(1, 0, uniform('park')), placed(1, -1, uniform('park')), placed(0, -1, uniform('industry')), placed(-1, 0, uniform('service')), placed(-1, 1, uniform('commerce')), placed(0, 1, uniform('habitat'))];
    // Centre with its ring: 3 + 3 - 2 + 2 + 1 + 1; then the pairs of the ring between themselves:
    // park-park +1, park-industry 0, industry-service 0, service-commerce +1, commerce-habitat +1, habitat-park +3.
    expect(scoreOf([centre, ...ring])).toBe(8 + 6);
  });

  it('counts a negative pair as a loss', () => {
    expect(scoreOf([placed(0, 0, uniform('habitat')), placed(0, 1, uniform('industry'))])).toBe(-2);
  });
});
