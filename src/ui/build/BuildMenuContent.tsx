import { Fragment, useId, useState, type ReactNode } from 'react';
import { TRANSIT, ECOLOGY_UNLOCKS, ECOLOGY, FACILITIES, ROAD_TIER_COSTS, isFacilityType, totalCitizens, placementCost } from '../../core';
import { t } from '../../i18n/t';
import type { Tool } from '../../tools/tools';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useGame, useUi } from '../common/hooks';
import { guideOf } from '../tutorial/tutorialGuide';
import { UrbsAmount } from '../common/UrbsAmount';
import { FieldTools } from './FieldTools';
import { BUILDING_SECTIONS, readBuildSection, writeBuildSection, type BuildSection } from './buildMenuSections';
import { ROAD_CONSTRUCTIONS } from '../../codex/construction';
import { codexImageKey, type CodexId } from '../../codex/catalog';
import { useCodexManifest } from '../codex/useCodexManifest';
import type { HomeColorVariant } from '../../core';
import { HOME_COLOR_VARIANTS, readHomeColor, writeHomeColor } from '../buildings/homeColor';
import { AccordionSection } from '../common/AccordionSection';
import { RadioChipGroup } from '../common/RadioChipGroup';

const categoryOf = (type: string | undefined) => (type !== undefined && isFacilityType(type) ? FACILITIES[type].category : null);

export function BuildMenuContent() {
  const citizens = useGame(store => totalCitizens(store.state));
  const flyout = useUi((store) => store.flyout);
  const chooseTool = useUi((store) => store.chooseTool);
  const openCodex = useUi(store => store.openCodex);
  const guide = guideOf(useGame((store) => store.state.tutorial));
  const [openSection, setOpenSection] = useState<BuildSection>(readBuildSection);
  const [homeColor, setHomeColor] = useState<HomeColorVariant>(readHomeColor);
  const menuId = useId();
  const { manifest } = useCodexManifest();
  const previewOf = (id: CodexId) => {
    const variant = id === 'home' || id === 'solarHome' ? homeColor : undefined;
    const image = manifest?.images[codexImageKey(id, 1, variant)];
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
            <AccordionSection key={section.title} id={sectionId} title={t(section.title)} expanded={expanded} lockWhenExpanded guided={section.types.some(type => guide.buildings.includes(type))} className="build-section" toggleClassName="build-section-toggle" contentClassName="build-section-items" onToggle={() => selectSection(section.title)}>
                {section.title === 'build.housing' && <RadioChipGroup
                  variant="toggle"
                  className="home-color-picker"
                  label={t('build.homeColor')}
                  options={HOME_COLOR_VARIANTS.map(variant => ({ value: variant, label: <><span className={`home-color-swatch home-color-swatch-${variant}`} aria-hidden="true" /><span>{t(`build.homeColor.${variant}`)}</span></> }))}
                  value={homeColor}
                  onChange={variant => { setHomeColor(variant); writeHomeColor(variant); }}
                />}
                {section.types.map((type, index) => (
                  <Fragment key={type}>
                  {isFacilityType(type) && FACILITIES[type].category !== categoryOf(section.types[index - 1]) && <h4 className="build-category">{t(`service.${FACILITIES[type].category}`)}</h4>}
                  <FlyoutItem
                    label={t(`building.${type}`)}
                    cost={<UrbsAmount value={placementCost(type)} />}
                    guided={guide.buildings.includes(type)}
                    onChoose={() => chooseTool({ kind: 'building', buildingType: type, ...(type === 'home' ? { colorVariant: homeColor } : {}) })}
                    codexId={type}
                    preview={previewOf(type)}
                    onInfo={() => openCodex(type)}
                  />
                  </Fragment>
                ))}
                {section.title === 'build.production' && <FieldTools />}
                {section.title === 'build.housing' && citizens >= ECOLOGY.solarUnlockCitizens && <FlyoutItem label={t('eco.solarHome')} cost={<UrbsAmount value={placementCost('home') + ECOLOGY.solarCost} />} onChoose={() => chooseTool({ kind: 'building', buildingType: 'home', solar: true, colorVariant: homeColor })} codexId="solarHome" preview={previewOf('solarHome')} onInfo={() => openCodex('solarHome')} />}
            </AccordionSection>
          );
        })}
      </>
    );
  }

  const roadTools: { label: string; cost?: ReactNode; tool: Tool; codexId?: CodexId }[] = [
    ...ROAD_CONSTRUCTIONS.filter(item => item.unlockCitizens === 0).map(item => ({ label: t(item.name), cost: item.perTile ? `${item.cost} ${t('tool.perTile')}` : <UrbsAmount value={item.cost} />, tool: item.tool, codexId: item.id })),
    { label: t('tool.upgradeRoad'), cost: `${ROAD_TIER_COSTS[1]}–${ROAD_TIER_COSTS[2]} ${t('tool.perTile')}`, tool: { kind: 'upgradeRoad', start: null, horizontalFirst: true } },
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
