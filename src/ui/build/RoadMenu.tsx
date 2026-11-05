import { useState, type ReactNode } from 'react';
import { BRIDGES, type NetworkMode, ROAD_TIER_COSTS, SURFACE, levelUnlocked, TRANSIT, WATER, totalCitizens, undergroundUnlocked, walkwayCostPerTile } from '../../core';
import { t } from '../../i18n/t';
import { toolLevel, type Tool } from '../../tools/tools';
import type { MessageKey } from '../../i18n/messages';
import { ROAD_CONSTRUCTIONS } from '../../codex/construction';
import { codexImageKey, type CodexId } from '../../codex/catalog';
import { AccordionSection } from '../common/AccordionSection';
import { useGame, useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { guideOf } from '../tutorial/tutorialGuide';
import { useCodexManifest } from '../codex/useCodexManifest';
import { FlyoutItem } from '../layout/FlyoutItem';
import { BridgeTools } from './BridgeTools';
import { SectionDemolishButton } from './SectionDemolishButton';
import { WaterTools } from './WaterTools';

type RoadSection = 'road' | 'pedestrian' | 'brt' | 'rail' | 'water' | 'maritimeBridges' | 'roadBridges' | 'underground';

interface RoadItem {
  label: string;
  cost?: ReactNode;
  tool: Tool;
  codexId?: CodexId;
}

const SECTION_TITLES: Record<RoadSection, MessageKey> = {
  road: 'roads.section.road',
  pedestrian: 'roads.section.pedestrian',
  brt: 'roads.section.brt',
  rail: 'roads.section.rail',
  water: 'roads.section.water',
  maritimeBridges: 'roads.section.maritimeBridges',
  roadBridges: 'roads.section.roadBridges',
  underground: 'roads.section.underground',
};

const demolishRoad = (mode?: NetworkMode): Tool => ({ kind: 'demolishRoad', ...(mode ? { mode } : {}), start: null, horizontalFirst: true });

const constructionItem = (id: 'pedestrianWay' | 'brt' | 'rail'): RoadItem => {
  const construction = ROAD_CONSTRUCTIONS.find(item => item.id === id)!;
  return { label: t(construction.name), cost: `${construction.cost} ${t('tool.perTile')}`, tool: construction.tool, codexId: construction.id };
};

export function RoadMenu() {
  const citizens = useGame(store => totalCitizens(store.state));
  const hasWater = useGame(store => (store.state.waterTiles ?? []).length > 0);
  const hasBridge = useGame(store => (store.state.bridges ?? []).length > 0);
  const undergroundOpen = useGame(store => undergroundUnlocked(store.state));
  const level = useUi(store => store.level);
  const chooseTool = useUi(store => store.chooseTool);
  const openCodex = useUi(store => store.openCodex);
  const pickStreetView = useUi(store => store.pickStreetView);
  const guide = guideOf(useGame(store => store.state.tutorial));
  const [openSection, setOpenSection] = useState<RoadSection | null>('road');
  const { manifest } = useCodexManifest();
  const previewOf = (id: CodexId) => {
    const image = manifest?.images[codexImageKey(id, 1, undefined)];
    return image ? `${import.meta.env.BASE_URL}codex/${image}` : undefined;
  };

  const roadItem = (item: (typeof ROAD_CONSTRUCTIONS)[number]): RoadItem => ({ label: t(item.name), cost: item.perTile ? `${item.cost} ${t('tool.perTile')}` : <UrbsAmount value={item.cost} />, tool: item.tool, codexId: item.id });
  const roadItems: RoadItem[] = [
    ...ROAD_CONSTRUCTIONS.filter(item => item.unlockCitizens === 0 && item.id !== 'pedestrianWay' && item.id !== 'crossing' && item.id !== 'pedestrianAccess').map(roadItem),
    { label: t('tool.upgradeRoad'), cost: `${ROAD_TIER_COSTS[1]!}–${ROAD_TIER_COSTS[2]!} ${t('tool.perTile')}`, tool: { kind: 'upgradeRoad', start: null, horizontalFirst: true } },
  ];
  const removeBridge = hasBridge ? { label: t('water.removeBridge'), tool: { kind: 'removeBridge' } as Tool } : undefined;
  const pedestrianItems: RoadItem[] = [
    roadItem(ROAD_CONSTRUCTIONS.find(item => item.id === 'crossing')!),
    { label: t('tool.removeCrossing'), tool: { kind: 'removeCrossing' } },
    constructionItem('pedestrianWay'),
    ...(undergroundOpen ? [roadItem(ROAD_CONSTRUCTIONS.find(item => item.id === 'pedestrianAccess')!)] : []),
    { label: t('tool.upgradePedestrianWay'), cost: `${Math.round(ROAD_TIER_COSTS[1]! * 0.9)}–${Math.round(ROAD_TIER_COSTS[2]! * 0.9)} ${t('tool.perTile')}`, tool: { kind: 'upgradePedestrianWay', start: null, horizontalFirst: true } },
  ];
  const sections: { id: RoadSection; items?: RoadItem[]; content?: ReactNode; demolish?: { label: string; tool: Tool } }[] = [
    { id: 'road', items: roadItems, demolish: { label: t('tool.demolishRoad'), tool: demolishRoad() } },
    { id: 'pedestrian', items: pedestrianItems, content: <BridgeTools variant="footbridge" />, demolish: { label: t('tool.demolishPedestrianWay'), tool: { kind: 'demolishPedestrianWay', start: null, horizontalFirst: true } } },
    ...(citizens >= TRANSIT.brt.unlock ? [{ id: 'brt' as const, items: [constructionItem('brt')], demolish: { label: t('tool.demolishBrt'), tool: demolishRoad('brt') } }] : []),
    ...(citizens >= TRANSIT.rail.unlock ? [{ id: 'rail' as const, items: [constructionItem('rail')], demolish: { label: t('tool.demolishRail'), tool: demolishRoad('rail') } }] : []),
    ...(citizens >= WATER.unlockCitizens ? [{ id: 'water' as const, content: <WaterTools />, demolish: hasWater ? { label: t('water.remove'), tool: { kind: 'brush', action: 'removeWater', tiles: [] } as Tool } : undefined }] : []),
    ...(citizens >= BRIDGES.unlockCitizens || hasBridge ? [
      { id: 'maritimeBridges' as const, content: <BridgeTools variant="maritime" />, demolish: removeBridge },
      { id: 'roadBridges' as const, content: <BridgeTools variant="road" />, demolish: removeBridge },
    ] : []),
  ];
  const metroOpen = useGame(store => levelUnlocked(store.state, -2));
  // The two underground networks, each built on its own Level: an item is available on that Level only.
  const undergroundItems: RoadItem[] = [
    { label: t('tool.walkway'), cost: `${walkwayCostPerTile()} ${t('tool.perTile')}`, tool: { kind: 'walkway', start: null, horizontalFirst: true } },
    ...(metroOpen ? [{ label: t('tool.metro'), cost: `${TRANSIT.metro.tileCost} ${t('tool.perTile')}`, tool: { kind: 'road', mode: 'metro', start: null, horizontalFirst: true } } as RoadItem] : []),
    { label: t('tool.demolishWalkway'), tool: { kind: 'demolishWalkway', start: null, horizontalFirst: true } },
    ...(metroOpen ? [{ label: t('tool.demolishMetro'), tool: demolishRoad('metro') } as RoadItem] : []),
  ];
  const undergroundSection = undergroundOpen ? [{ id: 'underground' as const, items: undergroundItems }] : [];
  const visibleSections: typeof sections = level === SURFACE ? [...sections, ...undergroundSection] : undergroundSection;
  const activeSection = openSection === null || visibleSections.some(section => section.id === openSection) ? openSection : visibleSections[0]?.id ?? null;

  return (
    <>
      {level === SURFACE ? <FlyoutItem label={t('dock.streetView')} icon="street-view.svg" onChoose={pickStreetView} /> : null}
      {visibleSections.map(({ id, items, content, demolish }) => (
        <AccordionSection
          key={id}
          id={`roads-${id}`}
          title={t(SECTION_TITLES[id])}
          expanded={activeSection === id}
          chevron
          className="road-section build-section"
          toggleClassName="build-section-toggle"
          contentClassName="build-section-items"
          onToggle={() => setOpenSection(activeSection === id ? null : id)}
          headerAction={demolish ? <SectionDemolishButton label={demolish.label} onChoose={() => chooseTool(demolish.tool)} /> : undefined}
        >
          {items?.map(item => (
            <FlyoutItem key={item.label} label={item.label} cost={item.cost} guided={guide.road && item.tool.kind === 'road'} disabled={toolLevel(item.tool) !== level} onChoose={() => chooseTool(item.tool)} codexId={item.codexId} preview={item.codexId ? previewOf(item.codexId) : undefined} onInfo={item.codexId ? () => openCodex(item.codexId!) : undefined} />
          ))}
          {content}
        </AccordionSection>
      ))}
    </>
  );
}
