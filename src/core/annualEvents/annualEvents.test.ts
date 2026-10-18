import { describe, expect, it } from 'vitest';
import { ANNUAL_EVENT_ENTRIES, annualEventById, annualEventWindow, isAnnualEventOpen, openAnnualEvents, type AnnualEventId } from './annualEvents';
import { civilDateOf, dayNumberOf } from './calendar';

const noon = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12).getTime();
const dateOf = (dayNumber: number) => { const { month, day } = civilDateOf(dayNumber); return [month, day]; };
const windowOf = (id: AnnualEventId, year: number) => annualEventWindow(annualEventById(id), year);

describe('Annual event definitions', () => {
  it('lists the eight events of the calendar', () => {
    expect(ANNUAL_EVENT_ENTRIES.map(({ id }) => id)).toEqual(['halloween', 'winterHolidays', 'easter', 'midsummer', 'spring', 'summer', 'autumn', 'winter']);
  });
});

describe('annualEventWindow', () => {
  it('runs from 21 days before the anchor date to 14 days after it', () => {
    const window = windowOf('halloween', 2026);
    expect(window.anchorDay).toBe(dayNumberOf({ year: 2026, month: 10, day: 31 }));
    expect([dateOf(window.startDay), dateOf(window.endDay)]).toEqual([[10, 10], [11, 14]]);
  });

  it('moves Easter with the year', () => {
    expect(dateOf(windowOf('easter', 2026).anchorDay)).toEqual([4, 5]);
    expect(dateOf(windowOf('easter', 2027).anchorDay)).toEqual([3, 28]);
  });

  it('anchors Midsummer on the Friday between 19 and 25 June', () => {
    expect(dateOf(windowOf('midsummer', 2025).anchorDay)).toEqual([6, 20]);
    expect(dateOf(windowOf('midsummer', 2026).anchorDay)).toEqual([6, 19]);
    expect(dateOf(windowOf('midsummer', 2027).anchorDay)).toEqual([6, 25]);
  });

  it('runs into the next year for Winter holidays', () => {
    const window = windowOf('winterHolidays', 2026);
    expect(window.year).toBe(2026);
    expect(civilDateOf(window.endDay)).toEqual({ year: 2027, month: 1, day: 8 });
  });
});

describe('isAnnualEventOpen', () => {
  it('is open from the first to the last day of the window, both included', () => {
    expect(isAnnualEventOpen('halloween', noon(2026, 10, 9))).toBe(false);
    expect(isAnnualEventOpen('halloween', noon(2026, 10, 10))).toBe(true);
    expect(isAnnualEventOpen('halloween', noon(2026, 11, 14))).toBe(true);
    expect(isAnnualEventOpen('halloween', noon(2026, 11, 15))).toBe(false);
  });

  it('holds from the first minute to the last minute of the local day', () => {
    expect(isAnnualEventOpen('halloween', new Date(2026, 9, 10, 0, 0, 1).getTime())).toBe(true);
    expect(isAnnualEventOpen('halloween', new Date(2026, 10, 14, 23, 59, 59).getTime())).toBe(true);
  });

  it('stays open after the new year until the end of the window', () => {
    expect(isAnnualEventOpen('winterHolidays', noon(2027, 1, 8))).toBe(true);
    expect(isAnnualEventOpen('winterHolidays', noon(2027, 1, 9))).toBe(false);
  });

  it('is open before the new year for an anchor early in January', () => {
    const early = { anchor: { kind: 'fixed', month: 1, day: 5 } } as const;
    expect(annualEventWindow(early, 2027).startDay).toBe(dayNumberOf({ year: 2026, month: 12, day: 15 }));
  });
});

describe('openAnnualEvents', () => {
  it('lists every event whose window is open, windows overlapping', () => {
    expect(openAnnualEvents(noon(2026, 12, 22)).map(({ id }) => id)).toEqual(['winterHolidays', 'winter']);
    expect(openAnnualEvents(noon(2026, 8, 1))).toEqual([]);
  });
});
