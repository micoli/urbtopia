import { Fragment, useId, useState } from 'react';
import { BUILDING_SPECS, ECOLOGY_UNLOCKS, ECOLOGY, FACILITIES, isFacilityType, totalCitizens, placementCost, isHomeType } from '../../core';
import { t } from '../../i18n/t';
import { FlyoutItem } from '../layout/FlyoutItem';
import { BuildSearch } from './BuildSearch';
import { BuildTypeItem } from './BuildTypeItem';
import { NextBuildingUnlock } from './NextBuildingUnlock';
import { FirstUseHint } from '../common/FirstUseHint';
import { Note } from '../common/Note';
import { useGame, useUi } from '../common/hooks';
import { guideOf } from '../tutorial/tutorialGuide';
import { UrbsAmount } from '../common/UrbsAmount';
import { FieldTools } from './FieldTools';
import { RoadMenu } from './RoadMenu';
import { BUILDING_SECTIONS, readBuildSection, writeBuildSection, type BuildSection } from './buildMenuSections';
import { codexImageKey, isHomeCodexId, solarCodexIdOf, type CodexId } from '../../codex/catalog';
import { useCodexManifest } from '../codex/useCodexManifest';
import type { ColorVariant } from '../../core';
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
  const [query, setQuery] = useState('');
  const [homeColor, setHomeColor] = useState<ColorVariant>(readHomeColor);
  const menuId = useId();
  const { manifest } = useCodexManifest();
  const previewOf = (id: CodexId) => {
    const variant = isHomeCodexId(id) ? homeColor : undefined;
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
    const needle = query.trim().toLowerCase();
    const results = needle ? visibleSections.flatMap(section => section.types).filter(type => t(`building.${type}`).toLowerCase().includes(needle)) : [];
    const searching = needle !== '';
    return (
      <>
        <FirstUseHint id="build">{t('hint.build')}</FirstUseHint>
        <BuildSearch query={query} onChange={setQuery} />
        {searching && (
          <div className="build-section-items">
            {results.length === 0 && <Note tone="muted">{t('build.noResults').replace('{query}', query.trim())}</Note>}
            {results.map(type => <BuildTypeItem key={type} type={type} homeColor={homeColor} preview={previewOf(type)} />)}
          </div>
        )}
        {!searching && visibleSections.map(section => {
          const expanded = activeSection === section.title;
          const sectionId = `${menuId}-${section.title}`;
          return (
              <AccordionSection
                  key={section.title}
                  id={sectionId}
                  title={t(section.title)}
                  expanded={expanded}
                  chevron
                  lockWhenExpanded
                  guided={section.types.some(type => guide.buildings.includes(type))}
                  className="build-section"
                  toggleClassName="build-section-toggle"
                  contentClassName="build-section-items"
                  onToggle={() => selectSection(section.title)}
              >
                {section.title === 'build.housing' && <RadioChipGroup
                    variant="toggle"
                    className="home-color-picker"
                    label={t('build.homeColor')}
                    options={HOME_COLOR_VARIANTS.map(variant => ({
                      value: variant,
                      label: <><span className={`home-color-swatch home-color-swatch-${variant}`}
                                     aria-hidden="true"/><span>{t(`build.homeColor.${variant}`)}</span></>
                    }))}
                    value={homeColor}
                    onChange={variant => {
                      setHomeColor(variant);
                      writeHomeColor(variant);
                    }}
                />}
                {section.types.map((type, index) => (
                    <Fragment key={type}>
                      {isFacilityType(type) && FACILITIES[type].category !== categoryOf(section.types[index - 1]) &&
                          <h4 className="build-category">{t(`service.${FACILITIES[type].category}`)}</h4>}
                      <BuildTypeItem type={type} homeColor={homeColor} preview={previewOf(type)} />
                    </Fragment>
                ))}
                {section.title === 'build.production' && <FieldTools/>}
                {section.title === 'build.housing' && citizens >= ECOLOGY.solarUnlockCitizens && <FlyoutItem
                    label={t('eco.solarHome')}
                    badge={BUILDING_SPECS.home.accessModes.includes('brt') ? t('build.brtCompatible') : undefined}
                    cost={<UrbsAmount value={placementCost('home') + ECOLOGY.solarCost}/>}
                    onChoose={() => chooseTool({
                      kind: 'building',
                      buildingType: 'home',
                      solar: true,
                      colorVariant: homeColor
                    })}
                    codexId="solarHome"
                    preview={previewOf('solarHome')}
                    onInfo={() => openCodex('solarHome')}
                />}
                {section.title === 'build.housing' && citizens >= ECOLOGY.solarUnlockCitizens && section.types.filter(type => isHomeType(type) && type !== 'home').map(type => (
                    <FlyoutItem
                        key={`${type}-solar`}
                        label={t(`building.solar-${type}`)}
                        badge={undefined/*BUILDING_SPECS[type].accessModes.includes('brt') ? t('build.brtCompatible') : undefined*/}
                        cost={<UrbsAmount value={placementCost(type) + ECOLOGY.solarCost}/>}
                        onChoose={() => chooseTool({
                          kind: 'building',
                          buildingType: type,
                          solar: true,
                          colorVariant: homeColor
                        })}
                        codexId={solarCodexIdOf(type)}
                        preview={previewOf(solarCodexIdOf(type))}
                        onInfo={() => openCodex(solarCodexIdOf(type))}
                    />
                ))}
              </AccordionSection>
          );
        })}
        {!searching && <NextBuildingUnlock candidates={BUILDING_SECTIONS.filter(section => !['build.decoration', 'build.greenSpaces'].includes(section.title)).flatMap(section => section.types)} />}
      </>
    );
  }

  return <RoadMenu />;
}
