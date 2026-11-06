import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import type { useLiveMatch } from './useLiveMatch';

export function ClubMatchRecord({ live }: { live: ReturnType<typeof useLiveMatch> }) {
  const nothingToRecord = live.decisions.length === 0;
  return (
    <>
      <div className="club-actions">
        <ActionButton variant="primary" disabled={live.recorded || nothingToRecord} onClick={live.record}>{t('club.match.record')}</ActionButton>
      </div>
      {live.recorded && <p className="note note--muted">{t('club.match.recorded')}</p>}
      {!live.recorded && nothingToRecord && <p className="note note--muted">{t('club.match.recordDisabled')}</p>}
    </>
  );
}
