import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { officeYieldMultiplierOf } from '../../core';
import { collectBadgeLabel } from '../collect/CollectBadge';
import { formatCompactAmount } from './formatCompactAmount';
import { useGame } from './hooks';
import { uncollectedUrbsOf, useUncollectedUrbs } from './useUncollectedUrbs';
import { toastStore } from '../../store/toastStore';
import { useDoubleTap } from './useDoubleTap';
import { UrbsSymbol } from './UrbsSymbol';

function collectPendingUrbs() {
  const { state, send } = gameStore.getState();
  const officeYield = officeYieldMultiplierOf(state);
  const collected = uncollectedUrbsOf(state);
  if (collected === 0) return toastStore.getState().show('collect.nothing');
  for (const building of state.buildings) {
    if (typeof collectBadgeLabel(building, officeYield) !== 'number') continue;
    send({ type: 'Collect', buildingId: building.id });
  }
  toastStore.getState().showText(t('collect.all').replace('{amount}', formatCompactAmount(collected)));
}

export function UrbsStat() {
  const urbs = useGame((store) => store.state.urbs);
  const uncollected = useUncollectedUrbs();
  const onPointerUp = useDoubleTap(collectPendingUrbs);
  return (
    <div className="dock-stat" title={t('stat.urbs')} onDoubleClick={collectPendingUrbs} onPointerUp={onPointerUp}>
      <span className="dock-stat-value">{formatCompactAmount(urbs)}</span>
      <span className="dock-stat-label">
        <UrbsSymbol />
      </span>
      <span className="dock-stat-pending" title={t('stat.uncollected')}>
        +{formatCompactAmount(uncollected)}
      </span>
    </div>
  );
}
