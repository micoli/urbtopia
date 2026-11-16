import { describe, expect, it } from 'vitest';
import { valueByTier } from './valueByTier';

describe('the value of a list by Tier', () => {
  it.each([
    { tier: 1, expected: 10 },
    { tier: 3, expected: 30 },
    { tier: 5, expected: 50 },
  ])('gives the value of Tier $tier', ({ tier, expected }) => {
    expect(valueByTier([10, 20, 30, 40, 50], tier)).toBe(expected);
  });

  it('gives the last value to a Tier beyond the list', () => {
    expect(valueByTier([10, 20, 30], 8)).toBe(30);
  });

  it('gives 0 for an empty list', () => {
    expect(valueByTier([], 3)).toBe(0);
  });
});
