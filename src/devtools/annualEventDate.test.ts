import { afterEach, describe, expect, it } from 'vitest';
import { forceAnnualEventDay, isAnnualEventOpen } from '../core';
import { dayOfIsoDate, isoDateOfDay } from './annualEventDate';

describe('annual event date', () => {
  afterEach(() => forceAnnualEventDay(undefined));

  it('round-trips an ISO date', () => {
    expect(isoDateOfDay(dayOfIsoDate('2026-09-15')!)).toBe('2026-09-15');
  });

  it('rejects anything that is not YYYY-MM-DD', () => {
    expect(dayOfIsoDate('')).toBeUndefined();
    expect(dayOfIsoDate('15/09/2026')).toBeUndefined();
  });

  it('opens the window judged on the forced day, whatever the clock says', () => {
    const now = new Date(2026, 9, 19, 12).getTime();
    expect(isAnnualEventOpen('autumn', now)).toBe(false);
    forceAnnualEventDay(dayOfIsoDate('2026-09-15'));
    expect(isAnnualEventOpen('autumn', now)).toBe(true);
    forceAnnualEventDay(undefined);
    expect(isAnnualEventOpen('autumn', now)).toBe(false);
  });
});
