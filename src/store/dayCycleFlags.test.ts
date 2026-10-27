import { describe, expect, it } from 'vitest';
import { isAlwaysDayRequested, pinnedCycleHourOf } from './dayCycleFlags';

describe('Day cycle URL flags', () => {
  it('asks for Always day with ?always-day or ?e2e', () => {
    expect(isAlwaysDayRequested('?always-day')).toBe(true);
    expect(isAlwaysDayRequested('?e2e')).toBe(true);
    expect(isAlwaysDayRequested('?x=1')).toBe(false);
    expect(isAlwaysDayRequested('')).toBe(false);
  });

  it('pins the cycle hour from ?time=HH:MM', () => {
    expect(pinnedCycleHourOf('?time=23:00')).toBe(23);
    expect(pinnedCycleHourOf('?e2e&time=05:30')).toBe(5.5);
    expect(pinnedCycleHourOf('?time=7:15')).toBe(7.25);
  });

  it('ignores a missing or invalid time', () => {
    expect(pinnedCycleHourOf('')).toBeNull();
    expect(pinnedCycleHourOf('?time=')).toBeNull();
    expect(pinnedCycleHourOf('?time=24:00')).toBeNull();
    expect(pinnedCycleHourOf('?time=12:60')).toBeNull();
    expect(pinnedCycleHourOf('?time=noon')).toBeNull();
  });
});
