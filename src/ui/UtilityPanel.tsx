import { productionFactors, UTILITY_CAPACITY, type Building } from '../core';
import { t } from '../i18n/t';
import { useGame } from './hooks';
import { UpgradeSection } from './UpgradeSection';

interface UtilityPanelProps {
  building: Building;
  type: 'powerPlant' | 'waterTower';
}

export function UtilityPanel({ building, type }: UtilityPanelProps) {
  const state = useGame(s => s.state);
  const wind = productionFactors(state.lastSeen + (state.timeOffset ?? 0)).wind;
  return (
    <section className="production">
      <h3>
          <strong>{t('home.tier')}</strong> {building.tier}
      </h3>
      <p>
        {type === 'powerPlant' ? `⚡ ${t('stat.power')}` : `💧 ${t('stat.water')}`}: {type === 'powerPlant' ? ((UTILITY_CAPACITY[type][building.tier - 1] ?? 0) * wind).toFixed(1) : UTILITY_CAPACITY[type][building.tier - 1] ?? 0}
      </p>
      <UpgradeSection building={building} />
    </section>
  );
}
