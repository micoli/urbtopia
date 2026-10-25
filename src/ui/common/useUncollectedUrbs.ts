import { officeYieldMultiplierOf, type GameState } from '../../core';
import { collectBadgeLabel } from '../collect/CollectBadge';
import { useGame } from './hooks';

export function uncollectedUrbsOf(state: GameState): number {
  const officeYield = officeYieldMultiplierOf(state);
  return state.buildings.reduce((total, building) => {
    const label = collectBadgeLabel(building, officeYield);
    return typeof label === 'number' ? total + label : total;
  }, 0);
}

export function useUncollectedUrbs(): number {
  return useGame((store) => uncollectedUrbsOf(store.state));
}
