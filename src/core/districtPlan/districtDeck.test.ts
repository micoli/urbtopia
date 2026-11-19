import { describe, expect, it } from 'vitest';
import { deckOf, deckSizeOf } from './districtDeck';
import { DISTRICT_PLAN } from './districtPlanBalance';
import { HEX_CATEGORIES } from './districtPlanVocabulary';
import { bestScoreOf } from './districtSolver';
import { isHexValid } from './hex';

describe('the Deck of an office', () => {
  it.each([
    { tier: 1, size: 24 },
    { tier: 2, size: 28 },
    { tier: 3, size: 32 },
    { tier: 4, size: 36 },
    { tier: 5, size: 40 },
    { tier: 9, size: 40 },
  ])('holds $size Hexes at Tier $tier', ({ tier, size }) => {
    expect(deckSizeOf(tier)).toBe(size);
    expect(deckOf('seed', 1, deckSizeOf(tier))).toHaveLength(size);
  });

  it('is the same for the same Seed and office, whatever the game', () => {
    expect(deckOf('seed', 7, 24)).toEqual(deckOf('seed', 7, 24));
  });

  it.each([
    { name: 'another office', other: () => deckOf('seed', 8, 24) },
    { name: 'another Seed', other: () => deckOf('other', 7, 24) },
  ])('is not the same for $name', ({ other }) => {
    expect(other()).not.toEqual(deckOf('seed', 7, 24));
  });

  it('only draws valid Hexes with two categories each', () => {
    const deck = deckOf('seed', 1, 40);
    expect(deck.every(isHexValid)).toBe(true);
    expect(deck.every(hex => new Set(hex.edges).size === 2)).toBe(true);
  });

  it('draws every category over many Decks', () => {
    const categories = new Set(Array.from({ length: 6 }, (_, index) => deckOf(`categories-${index}`, 1, 24)).flatMap(deck => deck.flatMap(hex => hex.edges)));
    expect(categories.size).toBe(HEX_CATEGORIES.length);
  });

  it.each([24, 28, 32, 36, 40])('can always be played to Gold, on a Deck of %i Hexes', size => {
    for (let index = 0; index < 8; index++) {
      const deck = deckOf(`gold-${index}`, 1 + index, size);
      expect(bestScoreOf(deck), `Seed gold-${index}`).toBeGreaterThanOrEqual(DISTRICT_PLAN.rankScorePerHex.gold * size);
    }
  }, 120_000);
});
