import { totalCitizens, utilityCapacity, utilityDemand } from '../core';
import { t } from '../i18n/t';
import { useGame, useUi } from './hooks';

export function CityStats() {
  const toggleStats = useUi(s => s.toggleStats);
  const state = useGame((store) => store.state);
  const capacity = utilityCapacity(state);
  const demand = utilityDemand(state);
  return (
    <button type="button" className="city-stats" aria-label={t('eco.title')} onClick={toggleStats}>
      <div title={t('stat.citizens')}>👥 {totalCitizens(state)}</div>
      <div title={t('stat.power')} className={demand.power >= capacity.power ? 'stat-tight' : ''}>
        ⚡ {Number(demand.power.toFixed(1))}/{Number(capacity.power.toFixed(1))}
      </div>
      <div title={t('stat.water')} className={demand.water >= capacity.water ? 'stat-tight' : ''}>
        💧 {demand.water}/{capacity.water}
      </div>
    </button>
  );
}
