import { t } from '../../i18n/t';

// "1 day", "3 days": the singular is the one only for exactly one day.
export function formatDays(count: number): string {
  return t(count === 1 ? 'politics.days.one' : 'politics.days.other').replace('{days}', String(count));
}
