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
  const state = useGame((store) => store.state);
  const toggleSearch = useUi((store) => store.toggleBuildingSearch);
  const capacity = utilityCapacity(state);
  const demand = utilityDemand(state);
  const powerDemand = Number(energyStats(state).demand.toFixed(1));
  const powerCapacity = Number(capacity.power.toFixed(1));
  const powerLabel = `${t('stat.power')}: ${powerDemand}/${powerCapacity}`;
  const waterLabel = `${t('stat.water')}: ${demand.water}/${capacity.water}`;
  return (
    <button className="city-stats" aria-label={t('eco.title')} onClick={toggleSearch}>
      <GameClock />
      <StatChip icon="citizens" value={totalCitizens(state)} title={t('stat.citizens')} />
      <StatChip icon="power" value={powerDemand} title={powerLabel} tone={utilityStatus(powerDemand, capacity.power)} labelled />
      <StatChip icon="water" value={demand.water} title={waterLabel} tone={utilityStatus(demand.water, capacity.water)} labelled />
    </button>
  );
}
