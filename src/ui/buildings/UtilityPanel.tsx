import { productionFactors, UTILITY_CAPACITY, type Building } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { UpgradeSection } from '../common/UpgradeSection.tsx';
import {DrawerPanelTitle} from "../common/DrawerPanelTitle.tsx";
import {DrawerProductionPanel} from "../common/DrawerProductionPanel.tsx";

interface UtilityPanelProps {
  building: Building;
  type: 'powerPlant' | 'waterTower';
}

export function UtilityPanel({ building, type }: UtilityPanelProps) {
  const state = useGame(s => s.state);
  const wind = productionFactors(state.lastSeen + (state.timeOffset ?? 0)).wind;
  return <DrawerProductionPanel>
      <DrawerPanelTitle title={t(`home.tier`)} level={building.tier}/>
      <p>
        {type === 'powerPlant' ? `⚡ ${t('stat.power')}` : `💧 ${t('stat.water')}`}: {type === 'powerPlant' ? ((UTILITY_CAPACITY[type][building.tier - 1] ?? 0) * wind).toFixed(1) : UTILITY_CAPACITY[type][building.tier - 1] ?? 0}
      </p>
      <UpgradeSection building={building} />
  </DrawerProductionPanel>
}
