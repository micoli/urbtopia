import { GAME_CONFIG, placementCost, type BuildingType } from '../core';
import { t } from '../i18n/t';
import type { Tool } from '../tools/tools';
import { FlyoutItem } from './FlyoutItem';
import { useGame, useUi } from './hooks';
import { guideOf } from './tutorialGuide';

const BUILDING_ORDER: BuildingType[] = ['workshop', 'factory', 'shop', 'storehouse', 'home', 'powerPlant', 'waterTower'];

export function BuildMenuContent() {
  const flyout = useUi((store) => store.flyout);
  const chooseTool = useUi((store) => store.chooseTool);
  const guide = guideOf(useGame((store) => store.state.tutorial));
  if (!flyout) return null;

  if (flyout === 'build') {
    return (
      <>
        {BUILDING_ORDER.map((type) => (
          <FlyoutItem
            key={type}
            label={t(`building.${type}`)}
            cost={`${placementCost(type)} ${t('stat.urbs')}`}
            guided={guide.buildings.includes(type)}
            onChoose={() => chooseTool({ kind: 'building', buildingType: type })}
          />
        ))}
      </>
    );
  }

  const roadTools: { label: string; cost?: string; tool: Tool }[] = [
    { label: t('tool.road'), cost: `${GAME_CONFIG.roadCostPerTile} ${t('tool.perTile')}`, tool: { kind: 'road', start: null, horizontalFirst: true } },
    { label: t('tool.crossing'), cost: `${GAME_CONFIG.crossingCost} ${t('stat.urbs')}`, tool: { kind: 'crossing' } },
    { label: t('tool.roundabout'), cost: `${GAME_CONFIG.roundaboutCost} ${t('stat.urbs')}`, tool: { kind: 'roundabout' } },
    { label: t('tool.demolishRoad'), tool: { kind: 'demolishRoad' } },
  ];
  return (
    <>
      {roadTools.map((item) => (
        <FlyoutItem key={item.label} label={item.label} cost={item.cost} guided={guide.road && item.tool.kind === 'road'} onChoose={() => chooseTool(item.tool)} />
      ))}
    </>
  );
}
