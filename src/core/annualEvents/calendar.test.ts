import { describe, expect, it } from 'vitest';
import { civilDateOf, dayNumberOf, easterSundayOf, weekdayOf } from './calendar';

describe('civil calendar', () => {
  it('counts days from 1970-01-01', () => {
    expect(dayNumberOf({ year: 1970, month: 1, day: 1 })).toBe(0);
    expect(dayNumberOf({ year: 2000, month: 3, day: 1 })).toBe(11_017);
    expect(dayNumberOf({ year: 1969, month: 12, day: 31 })).toBe(-1);
  });

  it('converts a day number back to the same date, across leap years', () => {
    for (const date of [{ year: 2024, month: 2, day: 29 }, { year: 2026, month: 12, day: 31 }, { year: 2027, month: 1, day: 1 }, { year: 1900, month: 3, day: 1 }]) {
      expect(civilDateOf(dayNumberOf(date))).toEqual(date);
    }
  });

  it('knows the weekday, Sunday being 0', () => {
    expect(weekdayOf(dayNumberOf({ year: 2026, month: 6, day: 19 }))).toBe(5);
    expect(weekdayOf(dayNumberOf({ year: 1970, month: 1, day: 1 }))).toBe(4);
    expect(weekdayOf(dayNumberOf({ year: 1969, month: 12, day: 28 }))).toBe(0);
  });
});

describe('easterSundayOf', () => {
  it.each([
    [2024, 3, 31],
    [2025, 4, 20],
    [2026, 4, 5],
    [2027, 3, 28],
    [2038, 4, 25],
  ])('falls on the Sunday of %i', (year, month, day) => {
    expect(easterSundayOf(year)).toEqual({ year, month, day });
    expect(weekdayOf(dayNumberOf({ year, month, day }))).toBe(0);
  });
});
