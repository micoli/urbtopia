import { annualEventsFigures } from '../../codex/annualEventsFigures';
import type { GameState } from '../../core';
import { DAYS_AFTER_ANNUAL_EVENT, DAYS_BEFORE_ANNUAL_EVENT } from '../../core/annualEvents/annualEvents';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { AnnualEventsTable } from './AnnualEventsTable';

interface AnnualEventsRulesProps {
  state: GameState;
}

export function AnnualEventsRules({ state }: AnnualEventsRulesProps) {
  return (
    <>
      <h3 className="codex-entry-name">{t('codex.annualEvents.title')}</h3>
      <p>{t('codex.annualEvents.intro')}</p>
      <p>{t('codex.annualEvents.rules').replace('{before}', String(DAYS_BEFORE_ANNUAL_EVENT)).replace('{after}', String(DAYS_AFTER_ANNUAL_EVENT))}</p>
      <h4>{t('codex.annualEvents.calendar')}</h4>
      <AnnualEventsTable events={annualEventsFigures(state)} language={prefsStore.getState().language} />
    </>
  );
}
