import { civilDateOf, dayNumberOf } from '../core';

export function dayOfIsoDate(value: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return dayNumberOf({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) });
}

export function isoDateOfDay(day: number): string {
  const { year, month, day: dayOfMonth } = civilDateOf(day);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
}
