import { useId, useState, type ReactNode } from 'react';
import { TRANSIT, ECOLOGY_UNLOCKS, ECOLOGY, totalCitizens, placementCost } from '../core';
import { t } from '../i18n/t';
import type { Tool } from '../tools/tools';
import { FlyoutItem } from './FlyoutItem';
import { useGame, useUi } from './hooks';
import { guideOf } from './tutorialGuide';
import { UrbsAmount } from './UrbsAmount';
import { BUILDING_SECTIONS, readBuildSection, writeBuildSection, type BuildSection } from './buildMenuSections';
import { ROAD_CONSTRUCTIONS } from '../codex/construction';
import { codexImageKey, type CodexId } from '../codex/catalog';
import { useCodexManifest } from './useCodexManifest';

export function BuildMenuContent() {
  const citizens = useGame(store => totalCitizens(store.state));
  const flyout = useUi((store) => store.flyout);
  const chooseTool = useUi((store) => store.chooseTool);
  const openCodex = useUi(store => store.openCodex);
  const guide = guideOf(useGame((store) => store.state.tutorial));
  const [openSection, setOpenSection] = useState<BuildSection>(readBuildSection);
  const menuId = useId();
  const { manifest } = useCodexManifest();
  const previewOf = (id: CodexId) => {
    const image = manifest?.images[codexImageKey(id, 1)];
    return image ? `${import.meta.env.BASE_URL}codex/${image}` : undefined;
  };
  if (!flyout) return null;

  if (flyout === 'build') {
    const visibleSections = BUILDING_SECTIONS.map(section => ({
      ...section,
      types: section.types.filter(type => citizens >= (ECOLOGY_UNLOCKS[type] ?? 0)),
    })).filter(section => section.types.length);
    const activeSection = visibleSections.some(section => section.title === openSection) ? openSection : visibleSections[0]?.title;
    const selectSection = (section: BuildSection) => {
      if (activeSection === section) return;
      setOpenSection(section);
      writeBuildSection(section);
    };
    return (
      <>
        {visibleSections.map(section => {
          const expanded = activeSection === section.title;
          const sectionId = `${menuId}-${section.title}`;
          return (
            <section className="build-section" key={section.title} aria-label={t(section.title)}>
              <h3>
                <button type="button" className="build-section-toggle" id={`${sectionId}-toggle`} aria-expanded={expanded} aria-disabled={expanded} aria-controls={sectionId} data-guided={section.types.some(type => guide.buildings.includes(type))} onClick={() => selectSection(section.title)}>
                  <span>{t(section.title)}</span>
                </button>
              </h3>
              <div className="build-section-items" id={sectionId} aria-labelledby={`${sectionId}-toggle`} hidden={!expanded}>
                {section.types.map(type => (
                  <FlyoutItem
                    key={type}
                    label={t(`building.${type}`)}
                    cost={<UrbsAmount value={placementCost(type)} />}
                    guided={guide.buildings.includes(type)}
                    onChoose={() => chooseTool({ kind: 'building', buildingType: type })}
                    codexId={type}
                    preview={previewOf(type)}
                    onInfo={() => openCodex(type)}
                  />
                ))}
                {section.title === 'build.housing' && citizens >= ECOLOGY.solarUnlockCitizens && <FlyoutItem label={t('eco.solarHome')} cost={<UrbsAmount value={placementCost('home') + ECOLOGY.solarCost} />} onChoose={() => chooseTool({ kind: 'building', buildingType: 'home', solar: true })} codexId="solarHome" preview={previewOf('solarHome')} onInfo={() => openCodex('solarHome')} />}
              </div>
            </section>
          );
        })}
      </>
    );
  }

  const roadTools: { label: string; cost?: ReactNode; tool: Tool; codexId?: CodexId }[] = [
    ...ROAD_CONSTRUCTIONS.filter(item => item.unlockCitizens === 0).map(item => ({ label: t(item.name), cost: item.perTile ? `${item.cost} ${t('tool.perTile')}` : <UrbsAmount value={item.cost} />, tool: item.tool, codexId: item.id })),
    { label: t('tool.demolishRoad'), tool: { kind: 'demolishRoad', start: null, horizontalFirst: true } },
  ];
  for (const mode of ['brt', 'rail'] as const) {
    if (citizens < TRANSIT[mode].unlock) continue;
    const construction = ROAD_CONSTRUCTIONS.find(item => item.id === mode)!;
    roadTools.push({ label: t(construction.name), cost: `${construction.cost} ${t('tool.perTile')}`, tool: construction.tool, codexId: construction.id });
    roadTools.push({ label: t(mode === 'brt' ? 'tool.demolishBrt' : 'tool.demolishRail'), tool: { kind: 'demolishRoad', mode, start: null, horizontalFirst: true } });
  }
  return (
    <>
      {roadTools.map((item) => (
        <FlyoutItem key={item.label} label={item.label} cost={item.cost} guided={guide.road && item.tool.kind === 'road'} onChoose={() => chooseTool(item.tool)} codexId={item.codexId} preview={item.codexId ? previewOf(item.codexId) : undefined} onInfo={item.codexId ? () => openCodex(item.codexId) : undefined} />
      ))}
    </>
  );
}
