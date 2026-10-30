import type { AttractionRow } from '../../core';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { ProgressBar } from '../common/ProgressBar';
import { UrbsAmount } from '../common/UrbsAmount';
import { formatTimeLeft } from '../common/formatDuration';

const HOUR_MS = 3_600_000;

export function TakingsMeter({ row }: { row: AttractionRow }) {
  const due = Math.floor(row.takings);
  return (
    <div className="takings-meter" data-full={row.full}>
      <div className="takings-meter-head">
        <span>{t('attraction.takings')}</span>
        <span><UrbsAmount value={due} /> / <UrbsAmount value={row.cap} /></span>
      </div>
      <ProgressBar value={row.takings} max={row.cap} label={t('attraction.takings')} />
      {row.full ? <p className="note note--warn">{t('attraction.cap')}</p> : null}
      {row.hoursToFull !== null ? <p className="tourism-help">{t('attraction.fullIn').replace('{time}', formatTimeLeft(row.hoursToFull * HOUR_MS))}</p> : null}
      <ActionButton variant="primary" block disabled={due === 0} onClick={() => gameStore.getState().send({ type: 'Collect', buildingId: row.building.id })}>
        {t('attraction.collect')} · <UrbsAmount value={due} />
      </ActionButton>
    </div>
  );
}
