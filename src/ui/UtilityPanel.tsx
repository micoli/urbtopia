import { UTILITY_CAPACITY, type Building } from '../core';
import { t } from '../i18n/t';
import { UpgradeSection } from './UpgradeSection';

interface UtilityPanelProps {
  building: Building;
  type: 'powerPlant' | 'waterTower';
}

export function UtilityPanel({ building, type }: UtilityPanelProps) {
  return (
    <section className="production">
      <h3>
        {t('home.tier')} {building.tier}
      </h3>
      <p>
        {type === 'powerPlant' ? `⚡ ${t('stat.power')}` : `💧 ${t('stat.water')}`}: {UTILITY_CAPACITY[type][building.tier - 1] ?? 0}
      </p>
      <UpgradeSection building={building} />
    </section>
  );
}
