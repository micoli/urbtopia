import { useId, useState, type ReactNode } from 'react';
import { TRANSIT, ECOLOGY_UNLOCKS, ECOLOGY, totalCitizens, GAME_CONFIG, placementCost } from '../core';
import { t } from '../i18n/t';
import type { Tool } from '../tools/tools';
import { FlyoutItem } from './FlyoutItem';
import { useGame, useUi } from './hooks';
import { guideOf } from './tutorialGuide';
import { UrbsAmount } from './UrbsAmount';
import { BUILDING_SECTIONS, readBuildSection, writeBuildSection, type BuildSection } from './buildMenuSections';

export function BuildMenuContent() {
  const citizens = useGame(store => totalCitizens(store.state));
  const flyout = useUi((store) => store.flyout);
  const chooseTool = useUi((store) => store.chooseTool);
  const guide = guideOf(useGame((store) => store.state.tutorial));
  const [openSection, setOpenSection] = useState<BuildSection>(readBuildSection);
  const menuId = useId();
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
                  />
                ))}
                {section.title === 'build.housing' && citizens >= 15 && <FlyoutItem label={t('eco.solarHome')} cost={<UrbsAmount value={placementCost('home') + ECOLOGY.solarCost} />} onChoose={() => chooseTool({ kind: 'building', buildingType: 'home', solar: true })} />}
              </div>
            </section>
          );
        })}
      </>
    );
  }

  const roadTools: { label: string; cost?: ReactNode; tool: Tool }[] = [
    { label: t('tool.road'), cost: `${GAME_CONFIG.roadCostPerTile} ${t('tool.perTile')}`, tool: { kind: 'road', start: null, horizontalFirst: true } },
    { label: t('tool.crossing'), cost: <UrbsAmount value={GAME_CONFIG.crossingCost} />, tool: { kind: 'crossing' } },
    { label: t('tool.roundabout'), cost: <UrbsAmount value={GAME_CONFIG.roundaboutCost} />, tool: { kind: 'roundabout' } },
    { label: t('tool.demolishRoad'), tool: { kind: 'demolishRoad', start: null, horizontalFirst: true } },
  ];
  for (const mode of ['brt', 'rail'] as const) {
    if (citizens < TRANSIT[mode].unlock) continue;
    roadTools.push({ label: t(`tool.${mode}`), cost: `${TRANSIT[mode].tileCost} ${t('tool.perTile')}`, tool: { kind: 'road', mode, start: null, horizontalFirst: true } });
    roadTools.push({ label: t(mode === 'brt' ? 'tool.demolishBrt' : 'tool.demolishRail'), tool: { kind: 'demolishRoad', mode, start: null, horizontalFirst: true } });
  }
  return (
    <>
      {roadTools.map((item) => (
        <FlyoutItem key={item.label} label={item.label} cost={item.cost} guided={guide.road && item.tool.kind === 'road'} onChoose={() => chooseTool(item.tool)} />
      ))}
    </>
  );
}
