import { describe, expect, it } from 'vitest';
import { formatReleaseDate } from './formatReleaseDate';

describe('formatReleaseDate', () => {
  it('writes the day, the month name and the time in the language', () => {
    const noon = '2026-11-08T12:48:45Z';
    expect(formatReleaseDate(noon, 'en')).toMatch(/November/);
    expect(formatReleaseDate(noon, 'fr')).toMatch(/novembre/);
    expect(formatReleaseDate(noon, 'fr')).toMatch(/\d{2}:\d{2}/);
  });

  it('gives nothing for a date it cannot read', () => {
    expect(formatReleaseDate('not a date', 'en')).toBe('');
  });
});
