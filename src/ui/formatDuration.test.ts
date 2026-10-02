import { describe, expect, it } from 'vitest';
import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [1, '0:01'],
    [59_000, '0:59'],
    [60_000, '1:00'],
    [125_500, '2:06'],
    [3_600_000, '1:00:00'],
    [-5000, '0:00'],
  ])('formats %d ms as %s', (milliseconds, expected) => {
    expect(formatDuration(milliseconds)).toBe(expected);
  });
});
