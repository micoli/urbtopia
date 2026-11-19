import { describe, expect, it } from 'vitest';
import { bestScoreOf } from './districtSolver';
import { scoreOf } from './districtScore';
import type { Hex } from './hex';

const uniform = (category: Hex['edges'][number]): Hex => ({ edges: [category, category, category, category, category, category] });

describe('the search for the best score of a Deck', () => {
  it('scores 0 for a Deck of one Hex', () => {
    expect(bestScoreOf([uniform('park')])).toBe(0);
  });

  it('finds the pair of two Hexes', () => {
    expect(bestScoreOf([uniform('habitat'), uniform('park')])).toBe(3);
  });

  it('finds the best of three: a Park and a Service both beside the Habitat', () => {
    const score = bestScoreOf([uniform('habitat'), uniform('park'), uniform('service')]);
    expect(score).toBe(3 + 2 + 0);
  });

  it('is never below what a naive layout of the same Deck scores', () => {
    const deck = [uniform('habitat'), uniform('habitat'), uniform('park'), uniform('park')];
    const naive = scoreOf([
      { cell: { q: 0, r: 0 }, hex: deck[0]! },
      { cell: { q: 1, r: 0 }, hex: deck[1]! },
      { cell: { q: 2, r: 0 }, hex: deck[2]! },
      { cell: { q: 3, r: 0 }, hex: deck[3]! },
    ]);
    expect(bestScoreOf(deck)).toBeGreaterThanOrEqual(naive);
  });

  it('is the same every time', () => {
    const deck = [uniform('habitat'), uniform('park'), uniform('water'), uniform('commerce'), uniform('industry')];
    expect(bestScoreOf(deck)).toBe(bestScoreOf(deck));
  });
});
