import type { LiveInterior } from '../../codex/interiorFigures';
import { t } from '../../i18n/t';
import { LabeledList } from '../common/LabeledList';
import { formatBenefit } from './formatBenefit';

interface InteriorLiveListProps {
  interiors: readonly LiveInterior[];
}

export function InteriorLiveList({ interiors }: InteriorLiveListProps) {
  if (interiors.length === 0) return <p className="note note--muted">{t('codex.interiors.none')}</p>;
  return (
    <>
      {interiors.map(({ buildingId, tier, fixtures, benefits }) => (
        <div key={buildingId}>
          <p className="note">{t('codex.interiors.liveRow').replace('{tier}', String(tier)).replace('{fixtures}', String(fixtures))}</p>
          <LabeledList>
            {benefits.map(({ label, format, value }) => <LabeledList.Row key={label} label={t(label)}>{formatBenefit(value, format)}</LabeledList.Row>)}
          </LabeledList>
        </div>
      ))}
    </>
  );
}
