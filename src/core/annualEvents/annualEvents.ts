import { entriesOf } from '../defs/entries';
import annualEventOrder from '../../../assets/defs/order/annualEvents.json' with { type: 'json' };
import { civilDateOf, dayNumberOf, easterSundayOf, weekdayOf } from './calendar';
import type { AnnualEventAnchor, AnnualEventDefinition } from './annualEventSchema';
import type { AnnualEventId } from './annualEventTypes.generated';

export type { AnnualEventId };

export const DAYS_BEFORE_ANNUAL_EVENT = 21;
export const DAYS_AFTER_ANNUAL_EVENT = 14;

// Checked against their schema by the definitions plugin at dev start and build, and by the tests.
const files = import.meta.glob<AnnualEventDefinition>('../../../assets/defs/annualEvents/*.json', { eager: true, import: 'default' });

export const ANNUAL_EVENT_ENTRIES = entriesOf<AnnualEventDefinition, AnnualEventId>(files, annualEventOrder);

export interface AnnualEventWindow {
  // The year of the anchor date: the year this occurrence is known by, even when the window runs into the next one.
  year: number;
  anchorDay: number;
  startDay: number;
  endDay: number;
}

export function anchorDayOf(anchor: AnnualEventAnchor, year: number): number {
  if (anchor.kind === 'fixed') return dayNumberOf({ year, month: anchor.month, day: anchor.day });
  if (anchor.kind === 'easter') return dayNumberOf(easterSundayOf(year));
  const first = dayNumberOf({ year, month: anchor.month, day: anchor.from });
  return first + ((anchor.weekday - weekdayOf(first) + 7) % 7);
}

export function annualEventWindow(event: Pick<AnnualEventDefinition, 'anchor'>, year: number): AnnualEventWindow {
  const anchorDay = anchorDayOf(event.anchor, year);
  return { year, anchorDay, startDay: anchorDay - DAYS_BEFORE_ANNUAL_EVENT, endDay: anchorDay + DAYS_AFTER_ANNUAL_EVENT };
}

// The calendar day of the device that holds `now`, as a day number.
export function localDayOf(now: number): number {
  const date = new Date(now);
  return dayNumberOf({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });
}

// A window can start in the year before its anchor or end in the year after it, so the neighbouring years are tried too.
export function openWindowOf(event: Pick<AnnualEventDefinition, 'anchor'>, now: number): AnnualEventWindow | undefined {
  const today = localDayOf(now);
  const thisYear = civilDateOf(today).year;
  return [thisYear - 1, thisYear, thisYear + 1].map(year => annualEventWindow(event, year)).find(({ startDay, endDay }) => startDay <= today && today <= endDay);
}

export const annualEventById = (id: AnnualEventId): (typeof ANNUAL_EVENT_ENTRIES)[number] => ANNUAL_EVENT_ENTRIES.find(entry => entry.id === id)!;

export const isAnnualEventOpen = (id: AnnualEventId, now: number): boolean => openWindowOf(annualEventById(id), now) !== undefined;

export const openAnnualEvents = (now: number): { id: AnnualEventId; window: AnnualEventWindow }[] =>
  ANNUAL_EVENT_ENTRIES.flatMap(entry => {
    const window = openWindowOf(entry, now);
    return window ? [{ id: entry.id, window }] : [];
  });
