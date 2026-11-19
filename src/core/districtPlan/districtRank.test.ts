import { describe, expect, it } from 'vitest';
import { rankOf } from './districtRank';

describe('the Rank of a score', () => {
  it.each([
    { score: 59, deckSize: 24, rank: undefined },
    { score: 60, deckSize: 24, rank: 'bronze' },
    { score: 83, deckSize: 24, rank: 'bronze' },
    { score: 84, deckSize: 24, rank: 'silver' },
    { score: 107, deckSize: 24, rank: 'silver' },
    { score: 108, deckSize: 24, rank: 'gold' },
    { score: 500, deckSize: 24, rank: 'gold' },
    { score: -10, deckSize: 24, rank: undefined },
  ])('gives $rank to $score on a Deck of $deckSize', ({ score, deckSize, rank }) => {
    expect(rankOf(score, deckSize)).toBe(rank);
  });

  it('asks more of a longer Deck', () => {
    expect(rankOf(105, 24)).toBe('silver');
    expect(rankOf(105, 40)).toBe('bronze');
  });
});
