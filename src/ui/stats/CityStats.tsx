import { useShallow } from 'zustand/react/shallow';
import { energyStats, totalCitizens, utilityCapacity, utilityDemand } from '../../core';
import { t } from '../../i18n/t';
import { useGame, useUi } from '../common/hooks';
import { GameClock } from './GameClock';
import { StatChip } from '../common/StatChip';

function utilityStatus(demand: number, capacity: number): 'normal' | 'warning' | 'critical' {
  if (demand === 0) return 'normal';
  if (demand >= capacity) return 'critical';
  if (demand >= capacity * 0.8) return 'warning';
  return 'normal';
}

export function CityStats() {
  const { citizens, powerDemand, powerCapacity, waterDemand, waterCapacity } = useGame(useShallow(({ state }) => {
    const capacity = utilityCapacity(state);
    return {
      citizens: totalCitizens(state),
      powerDemand: Number(energyStats(state).demand.toFixed(1)),
      powerCapacity: Number(capacity.power.toFixed(1)),
      waterDemand: utilityDemand(state).water,
      waterCapacity: capacity.water,
    };
  }));
  const toggleSearch = useUi((store) => store.toggleBuildingSearch);
  const powerLabel = `${t('stat.power')}: ${powerDemand}/${powerCapacity}`;
  const waterLabel = `${t('stat.water')}: ${waterDemand}/${waterCapacity}`;
  return (
    <button className="city-stats" aria-label={t('eco.title')} onClick={toggleSearch}>
      <GameClock />
      <StatChip icon="citizens" value={citizens} title={t('stat.citizens')} />
      <StatChip icon="power" value={powerDemand} title={powerLabel} tone={utilityStatus(powerDemand, powerCapacity)} labelled />
      <StatChip icon="water" value={waterDemand} title={waterLabel} tone={utilityStatus(waterDemand, waterCapacity)} labelled />
    </button>
  );
}
