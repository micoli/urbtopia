import { describe, expect, it } from 'vitest';
import { formatCompactAmount } from './formatCompactAmount';

describe('formatCompactAmount', () => {
  it.each([
    [0, '0'],
    [999.9, '999'],
    [1000, '1.0K'],
    [12_345, '12.3K'],
    [999_999, '999.9K'],
    [1_000_000, '1.0M'],
    [2_560_000_000, '2.5B'],
    [3_000_000_000_000, '3.0T'],
    [-5, '0'],
  ])('formats %d as %s', (value, expected) => {
    expect(formatCompactAmount(value)).toBe(expected);
  });
});
