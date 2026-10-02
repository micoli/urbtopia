import { totalCitizens, utilityCapacity, utilityDemand } from '../core';
import { t } from '../i18n/t';
import { useGame } from './hooks';

export function CityStats() {
  const state = useGame((store) => store.state);
  const capacity = utilityCapacity(state);
  const demand = utilityDemand(state);
  return (
    <div className="city-stats">
      <div title={t('stat.citizens')}>👥 {totalCitizens(state)}</div>
      <div title={t('stat.power')} className={demand.power >= capacity.power ? 'stat-tight' : ''}>
        ⚡ {demand.power}/{capacity.power}
      </div>
      <div title={t('stat.water')} className={demand.water >= capacity.water ? 'stat-tight' : ''}>
        💧 {demand.water}/{capacity.water}
      </div>
    </div>
  );
}
