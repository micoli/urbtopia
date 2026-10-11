import { ECOLOGY, connectedWaterKeys, generatorOutput, UTILITY_CAPACITY, type Building, type UtilityType } from '../../core';
import { t } from '../../i18n/t';
import { useGame } from '../common/hooks';
import { DrawerPanel } from '../common/DrawerPanel';

interface UtilityPanelProps {
  building: Building;
  type: UtilityType;
}

export function UtilityPanel({ building, type }: UtilityPanelProps) {
  const state = useGame(s => s.state);
  const isWater = type === 'waterTower';
  const value = isWater ? UTILITY_CAPACITY[type][building.tier - 1] ?? 0 : generatorOutput(state, building).toFixed(1);
  return <DrawerPanel>
      <p>
        {isWater ? `💧 ${t('stat.water')}` : `⚡ ${t('stat.power')}`}: {value}
      </p>
      {type === 'hydroPlant' && <p>{t('panel.flow').replace('{count}', String(connectedWaterKeys(state, building).size)).replace('{full}', String(ECOLOGY.hydroFullFlowTiles))}</p>}
      <DrawerPanel.Upgrade building={building} />
  </DrawerPanel>
}
