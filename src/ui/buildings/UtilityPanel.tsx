import { productionFactors, UTILITY_CAPACITY, type Building } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { DrawerPanel } from '../common/DrawerPanel';

interface UtilityPanelProps {
  building: Building;
  type: 'powerPlant' | 'waterTower';
}

export function UtilityPanel({ building, type }: UtilityPanelProps) {
  const state = useGame(s => s.state);
  const wind = productionFactors(state.lastSeen + (state.timeOffset ?? 0)).wind;
  return <DrawerPanel>
      <DrawerPanel.Title title={t(`home.tier`)} level={building.tier}/>
      <p>
        {type === 'powerPlant' ? `⚡ ${t('stat.power')}` : `💧 ${t('stat.water')}`}: {type === 'powerPlant' ? ((UTILITY_CAPACITY[type][building.tier - 1] ?? 0) * wind).toFixed(1) : UTILITY_CAPACITY[type][building.tier - 1] ?? 0}
      </p>
      <DrawerPanel.Upgrade building={building} />
  </DrawerPanel>
}
