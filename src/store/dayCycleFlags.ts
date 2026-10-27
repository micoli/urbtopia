import { isE2eRequested } from './e2eFlag';

export function isAlwaysDayRequested(search: string): boolean {
  return new URLSearchParams(search).has('always-day') || isE2eRequested(search);
}

// `?time=HH:MM` pins the Day cycle to a Cycle hour, for tests of the Night. Nothing else follows it: power and the HUD do not.
export function pinnedCycleHourOf(search: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(new URLSearchParams(search).get('time') ?? '');
  if (!match) return null;
  const hours = Number(match[1]), minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours + minutes / 60;
}
