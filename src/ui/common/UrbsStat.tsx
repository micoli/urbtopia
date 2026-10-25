import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { officeYieldMultiplierOf } from '../../core';
import { collectBadgeLabel } from '../collect/CollectBadge';
import { useGame } from './hooks';
import { useDoubleTap } from './useDoubleTap';
import { UrbsSymbol } from './UrbsSymbol';

function collectPendingUrbs() {
  const { state, send } = gameStore.getState();
  const officeYield = officeYieldMultiplierOf(state);
  for (const building of state.buildings) {
    if (typeof collectBadgeLabel(building, officeYield) !== 'number') continue;
    send({ type: 'Collect', buildingId: building.id });
  }
}

export function UrbsStat() {
  const urbs = useGame((store) => store.state.urbs);
  const onPointerUp = useDoubleTap(collectPendingUrbs);
  return (
    <div className="dock-stat" title={t('stat.urbs')} onDoubleClick={collectPendingUrbs} onPointerUp={onPointerUp}>
      <span className="dock-stat-value">{Math.floor(urbs)}</span>
      <span className="dock-stat-label">
        <UrbsSymbol />
      </span>
    </div>
  );
}
