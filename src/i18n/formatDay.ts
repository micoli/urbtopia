import { civilDateOf } from '../core/annualEvents/calendar';

// A day number as "31 October" or "31 octobre".
export function formatDay(dayNumber: number, language: 'en' | 'fr'): string {
  const { year, month, day } = civilDateOf(dayNumber);
  return new Date(year, month - 1, day).toLocaleDateString(language, { day: 'numeric', month: 'long' });
}
