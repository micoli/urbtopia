import { describe, expect, it } from 'vitest';
import { rankOf } from './districtRank';

describe('the Rank of a score', () => {
  it.each([
    { score: 35, deckSize: 24, rank: undefined },
    { score: 36, deckSize: 24, rank: 'bronze' },
    { score: 71, deckSize: 24, rank: 'bronze' },
    { score: 72, deckSize: 24, rank: 'silver' },
    { score: 95, deckSize: 24, rank: 'silver' },
    { score: 96, deckSize: 24, rank: 'gold' },
    { score: 500, deckSize: 24, rank: 'gold' },
    { score: -10, deckSize: 24, rank: undefined },
  ])('gives $rank to $score on a Deck of $deckSize', ({ score, deckSize, rank }) => {
    expect(rankOf(score, deckSize)).toBe(rank);
  });

  it('asks more of a longer Deck', () => {
    expect(rankOf(80, 24)).toBe('silver');
    expect(rankOf(80, 40)).toBe('bronze');
  });
});
