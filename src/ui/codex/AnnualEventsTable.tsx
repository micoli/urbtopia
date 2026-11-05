import type { AnnualEventFigure } from '../../codex/annualEventsFigures';
import type { Language } from '../../i18n/prefsStore';
import { formatDay } from '../../i18n/formatDay';
import { t } from '../../i18n/t';

function statusOf({ status, daysUntilOpen }: AnnualEventFigure): string {
  if (status === 'open') return t('codex.annualEvents.open');
  if (daysUntilOpen === 1) return t('codex.annualEvents.opensTomorrow');
  return t('codex.annualEvents.opensIn').replace('{days}', String(daysUntilOpen));
}

interface AnnualEventsTableProps {
  events: readonly AnnualEventFigure[];
  language: Language;
}

export function AnnualEventsTable({ events, language }: AnnualEventsTableProps) {
  return (
    <div className="codex-economy-scroll">
      <table className="codex-economy">
        <thead>
          <tr>
            <th scope="col">{t('codex.annualEvents.event')}</th>
            <th scope="col">{t('codex.annualEvents.date')}</th>
            <th scope="col">{t('codex.annualEvents.window')}</th>
            <th scope="col">{t('codex.annualEvents.status')}</th>
            <th scope="col">{t('codex.annualEvents.items')}</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id} data-open={event.status === 'open'}>
              <th scope="row">{t(`annualEvent.${event.id}`)}</th>
              <td>{formatDay(event.window.anchorDay, language)}</td>
              <td>{t('codex.annualEvents.range').replace('{from}', formatDay(event.window.startDay, language)).replace('{to}', formatDay(event.window.endDay, language))}</td>
              <td>{statusOf(event)}</td>
              <td>{event.items.length === 0 ? t('codex.annualEvents.noItems') : event.items.map(item => t(`building.${item}`)).join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
