import { useState, type ReactNode } from 'react';
import { BRIDGES, ROAD_TIER_COSTS, TRANSIT, WATER, totalCitizens } from '../../core';
import { t } from '../../i18n/t';
import type { Tool } from '../../tools/tools';
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

type RoadSection = 'road' | 'brt' | 'rail' | 'water' | 'bridges';

interface RoadItem {
  label: string;
  cost?: ReactNode;
  tool: Tool;
  codexId?: CodexId;
}

const SECTION_TITLES: Record<RoadSection, MessageKey> = {
  road: 'roads.section.road',
  brt: 'roads.section.brt',
  rail: 'roads.section.rail',
  water: 'roads.section.water',
  bridges: 'roads.section.bridges',
};

const demolishRoad = (mode?: 'brt' | 'rail'): Tool => ({ kind: 'demolishRoad', ...(mode ? { mode } : {}), start: null, horizontalFirst: true });

const constructionItem = (id: 'brt' | 'rail'): RoadItem => {
  const construction = ROAD_CONSTRUCTIONS.find(item => item.id === id)!;
  return { label: t(construction.name), cost: `${construction.cost} ${t('tool.perTile')}`, tool: construction.tool, codexId: construction.id };
};

export function RoadMenu() {
  const citizens = useGame(store => totalCitizens(store.state));
  const hasWater = useGame(store => (store.state.waterTiles ?? []).length > 0);
  const hasBridge = useGame(store => (store.state.bridges ?? []).length > 0);
  const chooseTool = useUi(store => store.chooseTool);
  const openCodex = useUi(store => store.openCodex);
  const guide = guideOf(useGame(store => store.state.tutorial));
  const [openSection, setOpenSection] = useState<RoadSection>('road');
  const { manifest } = useCodexManifest();
  const previewOf = (id: CodexId) => {
    const image = manifest?.images[codexImageKey(id, 1, undefined)];
    return image ? `${import.meta.env.BASE_URL}codex/${image}` : undefined;
  };

  const roadItems: RoadItem[] = [
    ...ROAD_CONSTRUCTIONS.filter(item => item.unlockCitizens === 0).map(item => ({ label: t(item.name), cost: item.perTile ? `${item.cost} ${t('tool.perTile')}` : <UrbsAmount value={item.cost} />, tool: item.tool, codexId: item.id })),
    { label: t('tool.upgradeRoad'), cost: `${ROAD_TIER_COSTS[1]}–${ROAD_TIER_COSTS[2]} ${t('tool.perTile')}`, tool: { kind: 'upgradeRoad', start: null, horizontalFirst: true } },
  ];
  const sections: { id: RoadSection; items?: RoadItem[]; content?: ReactNode; demolish?: { label: string; tool: Tool } }[] = [
    { id: 'road', items: roadItems, demolish: { label: t('tool.demolishRoad'), tool: demolishRoad() } },
    ...(citizens >= TRANSIT.brt.unlock ? [{ id: 'brt' as const, items: [constructionItem('brt')], demolish: { label: t('tool.demolishBrt'), tool: demolishRoad('brt') } }] : []),
    ...(citizens >= TRANSIT.rail.unlock ? [{ id: 'rail' as const, items: [constructionItem('rail')], demolish: { label: t('tool.demolishRail'), tool: demolishRoad('rail') } }] : []),
    ...(citizens >= WATER.unlockCitizens ? [{ id: 'water' as const, content: <WaterTools />, demolish: hasWater ? { label: t('water.remove'), tool: { kind: 'brush', action: 'removeWater', tiles: [] } as Tool } : undefined }] : []),
    ...(citizens >= BRIDGES.unlockCitizens || hasBridge ? [{ id: 'bridges' as const, content: <BridgeTools />, demolish: hasBridge ? { label: t('water.removeBridge'), tool: { kind: 'removeBridge' } as Tool } : undefined }] : []),
  ];
  const activeSection = sections.some(section => section.id === openSection) ? openSection : 'road';

  return (
    <>
      {sections.map(({ id, items, content, demolish }) => (
        <AccordionSection
          key={id}
          id={`roads-${id}`}
          title={t(SECTION_TITLES[id])}
          expanded={activeSection === id}
          chevron
          lockWhenExpanded
          className="road-section build-section"
          toggleClassName="build-section-toggle"
          contentClassName="build-section-items"
          onToggle={() => setOpenSection(id)}
          headerAction={demolish ? <SectionDemolishButton label={demolish.label} onChoose={() => chooseTool(demolish.tool)} /> : undefined}
        >
          {items?.map(item => (
            <FlyoutItem key={item.label} label={item.label} cost={item.cost} guided={guide.road && item.tool.kind === 'road'} onChoose={() => chooseTool(item.tool)} codexId={item.codexId} preview={item.codexId ? previewOf(item.codexId) : undefined} onInfo={item.codexId ? () => openCodex(item.codexId!) : undefined} />
          ))}
          {content}
        </AccordionSection>
      ))}
    </>
  );
}
