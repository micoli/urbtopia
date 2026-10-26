import { useState, type ReactNode } from 'react';
import { DATA_LAYERS, MOVEMENT_LAYERS, SERVICE_CATEGORIES, type AnalyticsLayerId } from '../../core';
import { t } from '../../i18n/t';
import { AccordionSection } from '../common/AccordionSection';
import { useUi } from '../common/hooks';
import { FlyoutItem } from '../layout/FlyoutItem';

const movementLayers: readonly AnalyticsLayerId[] = MOVEMENT_LAYERS.map(layer => `movement.${layer}` as const);
const dataLayers: readonly AnalyticsLayerId[] = DATA_LAYERS.filter(layer => layer !== 'coverage').map(layer => `data.${layer}` as const);

type LandSection = 'movement' | 'data' | 'coverage';

const sectionOf = (layer: AnalyticsLayerId | null): LandSection => (layer === 'data.coverage' ? 'coverage' : layer?.startsWith('data.') ? 'data' : 'movement');

export function LandMenu() {
  const chooseTool = useUi(store => store.chooseTool);
  const enterAnalytics = useUi(store => store.enterAnalytics);
  const lastLayer = useUi(store => store.lastAnalyticsLayer);
  const lastCategory = useUi(store => store.analyticsCategory);
  const [openSection, setOpenSection] = useState<LandSection>(sectionOf(lastLayer));

  const layerItems = (layers: readonly AnalyticsLayerId[]) => layers.map(layer => (
    <FlyoutItem key={layer} label={t(`analytics.layer.${layer}`)} selected={layer === lastLayer} onChoose={() => enterAnalytics(layer)} />
  ));

  const section = (id: LandSection, title: string, items: ReactNode) => (
    <AccordionSection id={`land-${id}`} title={title} expanded={openSection === id} chevron lockWhenExpanded className="land-section build-section" toggleClassName="build-section-toggle" contentClassName="build-section-items" onToggle={() => setOpenSection(id)}>
      {items}
    </AccordionSection>
  );

  return (
    <>
      <FlyoutItem label={t('land.parcels')} onChoose={() => chooseTool({ kind: 'parcel' })} />
      {section('movement', t('analytics.movement'), layerItems(movementLayers))}
      {section('data', t('analytics.data'), layerItems(dataLayers))}
      {section('coverage', t('analytics.layer.data.coverage'), SERVICE_CATEGORIES.map(category => (
        <FlyoutItem key={category} label={t(`service.${category}`)} selected={lastLayer === 'data.coverage' && category === lastCategory} onChoose={() => enterAnalytics('data.coverage', category)} />
      )))}
    </>
  );
}
