import type { ReactNode } from 'react';
import { ECOLOGY_UNLOCKS, ECOLOGY, totalCitizens, GAME_CONFIG, placementCost, type BuildingType } from '../core';
import { t } from '../i18n/t';
import type { Tool } from '../tools/tools';
import { FlyoutItem } from './FlyoutItem';
import { useGame, useUi } from './hooks';
import { guideOf } from './tutorialGuide';
import { UrbsAmount } from './UrbsAmount';

const BUILDING_ORDER: BuildingType[] = ['workshop', 'factory', 'shop', 'storehouse', 'silo', 'vault', 'home', 'powerPlant', 'waterTower', 'tree', 'park', 'solar', 'battery', 'backup', 'busStop'];

export function BuildMenuContent() {
  const citizens = useGame(store => totalCitizens(store.state));
  const flyout = useUi((store) => store.flyout);
  const chooseTool = useUi((store) => store.chooseTool);
  const guide = guideOf(useGame((store) => store.state.tutorial));
  if (!flyout) return null;

  if (flyout === 'build') {
    return (
      <>
        {citizens >= 15 && <FlyoutItem label={t('eco.solarHome')} cost={<UrbsAmount value={placementCost('home') + ECOLOGY.solarCost} />} onChoose={() => chooseTool({ kind: 'building', buildingType: 'home', solar: true })} />}
        {BUILDING_ORDER.filter(type => citizens >= (ECOLOGY_UNLOCKS[type] ?? 0)).map((type) => (
          <FlyoutItem
            key={type}
            label={t(`building.${type}`)}
            cost={<UrbsAmount value={placementCost(type)} />}
            guided={guide.buildings.includes(type)}
            onChoose={() => chooseTool({ kind: 'building', buildingType: type })}
          />
        ))}
      </>
    );
  }

  const roadTools: { label: string; cost?: ReactNode; tool: Tool }[] = [
    { label: t('tool.road'), cost: `${GAME_CONFIG.roadCostPerTile} ${t('tool.perTile')}`, tool: { kind: 'road', start: null, horizontalFirst: true } },
    { label: t('tool.crossing'), cost: <UrbsAmount value={GAME_CONFIG.crossingCost} />, tool: { kind: 'crossing' } },
    { label: t('tool.roundabout'), cost: <UrbsAmount value={GAME_CONFIG.roundaboutCost} />, tool: { kind: 'roundabout' } },
    { label: t('tool.demolishRoad'), tool: { kind: 'demolishRoad', start: null, horizontalFirst: true } },
  ];
  return (
    <>
      {roadTools.map((item) => (
        <FlyoutItem key={item.label} label={item.label} cost={item.cost} guided={guide.road && item.tool.kind === 'road'} onChoose={() => chooseTool(item.tool)} />
      ))}
    </>
  );
}
