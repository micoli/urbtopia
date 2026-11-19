import { describe, expect, it } from 'vitest';
import { deckOf, deckSizeOf } from './districtDeck';
import { isHexValid } from './hex';

describe('the Deck of a game', () => {
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
    { name: 'another office', other: deckOf('seed', 8, 24) },
    { name: 'another Seed', other: deckOf('other', 7, 24) },
  ])('is not the same for $name', ({ other }) => {
    expect(other).not.toEqual(deckOf('seed', 7, 24));
  });

  it('starts the same way when the Deck is longer', () => {
    expect(deckOf('seed', 1, 40).slice(0, 24)).toEqual(deckOf('seed', 1, 24));
  });

  it('only draws valid Hexes with two categories each', () => {
    const deck = deckOf('seed', 1, 400);
    expect(deck.every(isHexValid)).toBe(true);
    expect(deck.every(hex => new Set(hex.edges).size === 2)).toBe(true);
  });

  it('draws every category over many Hexes', () => {
    const categories = new Set(deckOf('seed', 1, 400).flatMap(hex => hex.edges));
    expect(categories.size).toBe(6);
  });
});
