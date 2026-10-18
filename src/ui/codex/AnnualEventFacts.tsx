import { BUILDING_SPECS, annualEventById, annualEventOf, annualEventWindow, civilDateOf, localDayOf, type BuildingType } from '../../core';
import type { CodexId } from '../../codex/catalog';
import { formatDay } from '../../i18n/formatDay';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { useNow } from '../common/useNow';

// The window of the event this year, or next year's once this year's is over.
const upcomingWindow = (eventId: Parameters<typeof annualEventById>[0], now: number) => {
  const today = localDayOf(now);
  const thisYear = annualEventWindow(annualEventById(eventId), civilDateOf(today).year);
  return thisYear.endDay >= today ? thisYear : annualEventWindow(annualEventById(eventId), thisYear.year + 1);
};

export function AnnualEventFacts({ id }: { id: CodexId }) {
  const now = useNow(60_000);
  const eventId = id in BUILDING_SPECS ? annualEventOf(id as BuildingType) : undefined;
  if (!eventId) return null;
  const window = upcomingWindow(eventId, now);
  const language = prefsStore.getState().language;
  return (
    <>
      <h4>{t(`annualEvent.${eventId}`)}</h4>
      <p>{t('annualEvent.availability').replace('{from}', formatDay(window.startDay, language)).replace('{to}', formatDay(window.endDay, language))}</p>
    </>
  );
}
