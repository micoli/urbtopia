import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { UrbsAmount } from '../common/UrbsAmount';
import type { Worn } from './worn';

interface InteriorRepairsProps {
  buildingId: number;
  repairs: Worn;
}

// The Repair everything button and under it what is worn, once the repairs reach the share of the Fixtures' cost set for the badges of the taxes.
export function InteriorRepairs({ buildingId, repairs }: InteriorRepairsProps) {
  if (repairs.total === 0 || repairs.ratio * 100 < 90) return null;
  return (
    <>
      <ActionButton block onClick={() => gameStore.getState().send({ type: 'RepairAllInteriorFixtures', buildingId })}>{t('venue.repairAll')} <UrbsAmount value={repairs.total} /></ActionButton>
      {repairs.lines.length > 0 ? (
        <details className="note note--muted repair-detail">
          <summary>{t('venue.repairDetail')}</summary>
          <ul>
            {repairs.lines.map(line => <li key={line.type}>{line.count > 1 ? `${line.count} × ` : ''}{t(`venue.fixture.${line.type}`)} · {Math.round(line.condition)} % · <UrbsAmount value={line.cost} /></li>)}
          </ul>
        </details>
      ) : null}
    </>
  );
}
