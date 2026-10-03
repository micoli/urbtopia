import { totalCitizens, utilityCapacity, utilityDemand } from '../core';
import { t } from '../i18n/t';
import { useGame, useUi } from './hooks';

function utilityStatus(demand: number, capacity: number): string {
  if (demand === 0) return 'utility-normal';
  if (demand >= capacity) return 'utility-critical';
  if (demand >= capacity * 0.8) return 'utility-warning';
  return 'utility-normal';
}

export function CityStats() {
  const toggleStats = useUi(s => s.toggleStats);
  const state = useGame((store) => store.state);
  const capacity = utilityCapacity(state);
  const demand = utilityDemand(state);
  const powerDemand = Number(demand.power.toFixed(1));
  const powerCapacity = Number(capacity.power.toFixed(1));
  const powerLabel = `${t('stat.power')}: ${powerDemand}/${powerCapacity}`;
  const waterLabel = `${t('stat.water')}: ${demand.water}/${capacity.water}`;
  return (
    <button type="button" className="city-stats" aria-label={t('eco.title')} onClick={toggleStats}>
      <div title={t('stat.citizens')}>👥 {totalCitizens(state)}</div>
      <div title={powerLabel} aria-label={powerLabel} className={utilityStatus(demand.power, capacity.power)}>
        ⚡ {powerDemand}
      </div>
      <div title={waterLabel} aria-label={waterLabel} className={utilityStatus(demand.water, capacity.water)}>
        💧 {demand.water}
      </div>
    </button>
  );
}
