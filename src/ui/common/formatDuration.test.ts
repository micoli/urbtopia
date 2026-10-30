import { describe, expect, it } from 'vitest';
import { formatDuration, formatTimeLeft } from './formatDuration';

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

describe('formatTimeLeft', () => {
  it('reads as a player would say it', () => {
    expect(formatTimeLeft(0)).toBe('1 min');
    expect(formatTimeLeft(42 * 60_000)).toBe('42 min');
    expect(formatTimeLeft(3_600_000)).toBe('1 h');
    expect(formatTimeLeft(2 * 3_600_000 + 5 * 60_000)).toBe('2 h 05');
  });
});
