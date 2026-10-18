import { ANNUAL_EVENT_ENTRIES } from '../core/annualEvents/annualEvents';
import type { AnnualEventId } from '../core/annualEvents/annualEventTypes.generated';

type AnnualEventMessageKey = `annualEvent.${AnnualEventId}`;

export function annualEventMessages(language: 'en' | 'fr'): Record<AnnualEventMessageKey, string> {
  return Object.fromEntries(ANNUAL_EVENT_ENTRIES.map(entry => [`annualEvent.${entry.id}`, entry.name[language]])) as Record<AnnualEventMessageKey, string>;
}
