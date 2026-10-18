import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { collectBadgeLabel } from '../collect/CollectBadge';
import { useGame } from './hooks';
import { UrbsSymbol } from './UrbsSymbol';

function collectPendingUrbs() {
  const { state, send } = gameStore.getState();
  for (const building of state.buildings) {
    if (typeof collectBadgeLabel(building) !== 'number') continue;
    send({ type: 'Collect', buildingId: building.id });
  }
}

export function UrbsStat() {
  const urbs = useGame((store) => store.state.urbs);
  return (
    <div className="dock-stat" title={t('stat.urbs')} onDoubleClick={collectPendingUrbs}>
      <span className="dock-stat-value">{Math.floor(urbs)}</span>
      <span className="dock-stat-label">
        <UrbsSymbol />
      </span>
    </div>
  );
}
