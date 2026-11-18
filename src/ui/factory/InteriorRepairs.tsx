import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { UrbsAmount } from '../common/UrbsAmount';
import type { Worn } from './worn';

interface InteriorRepairsProps {
  buildingId: number;
  repairs: Worn;
}

// The Repair everything button and under it what is due for a repair, once a Fixture is under the condition below which it is worth repairing.
export function InteriorRepairs({ buildingId, repairs }: InteriorRepairsProps) {
  if (repairs.lines.length === 0) return null;
  return (
    <>
      <ActionButton block onClick={() => gameStore.getState().send({ type: 'RepairAllInteriorFixtures', buildingId })}>{t('venue.repairAll')} <UrbsAmount value={repairs.total} /></ActionButton>
      <details className="note note--muted repair-detail">
        <summary>{t('venue.repairDetail')}</summary>
        <ul>
          {repairs.lines.map(line => <li key={line.type}>{line.count > 1 ? `${line.count} × ` : ''}{t(`venue.fixture.${line.type}`)} · {Math.floor(line.condition)} % · <UrbsAmount value={line.cost} /></li>)}
        </ul>
      </details>
    </>
  );
}
