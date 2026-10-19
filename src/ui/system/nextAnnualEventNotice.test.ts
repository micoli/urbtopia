import { describe, expect, it } from 'vitest';
import { nextAnnualEventNotice } from './nextAnnualEventNotice';

const noon = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12).getTime();

describe('nextAnnualEventNotice', () => {
  it('announces an open event that has items', () => {
    const notice = nextAnnualEventNotice(noon(2026, 10, 19), []);
    expect(notice?.eventId).toBe('halloween');
    expect(notice?.key).toBe('halloween:2026');
  });

  it('stays silent once dismissed for the year', () => {
    expect(nextAnnualEventNotice(noon(2026, 10, 19), ['halloween:2026'])).toBeUndefined();
  });

  it('comes back the year after', () => {
    expect(nextAnnualEventNotice(noon(2027, 10, 19), ['halloween:2026'])?.key).toBe('halloween:2027');
  });

  it('stays silent outside every window', () => {
    expect(nextAnnualEventNotice(noon(2026, 8, 1), [])).toBeUndefined();
  });

  it('stays silent for an open event that has no item yet', () => {
    expect(nextAnnualEventNotice(noon(2026, 6, 21), [])).toBeUndefined();
  });
});
