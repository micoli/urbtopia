import { useState } from 'react';
import { DATA_LAYERS, MOVEMENT_LAYERS, type AnalyticsLayerId } from '../../core';
import { t } from '../../i18n/t';
import { AccordionSection } from '../common/AccordionSection';
import { useUi } from '../common/hooks';
import { FlyoutItem } from '../layout/FlyoutItem';

const movementLayers: readonly AnalyticsLayerId[] = MOVEMENT_LAYERS.map(layer => `movement.${layer}` as const);
const dataLayers: readonly AnalyticsLayerId[] = DATA_LAYERS.map(layer => `data.${layer}` as const);

export function LandMenu() {
  const chooseTool = useUi(store => store.chooseTool);
  const enterAnalytics = useUi(store => store.enterAnalytics);
  const lastLayer = useUi(store => store.lastAnalyticsLayer);
  const [openSection, setOpenSection] = useState<'movement' | 'data'>(lastLayer?.startsWith('data.') ? 'data' : 'movement');

  const layerItems = (layers: readonly AnalyticsLayerId[]) => layers.map(layer => (
    <FlyoutItem key={layer} label={t(`analytics.layer.${layer}`)} selected={layer === lastLayer} onChoose={() => enterAnalytics(layer)} />
  ));

  return (
    <>
      <FlyoutItem label={t('land.parcels')} onChoose={() => chooseTool({ kind: 'parcel' })} />
      <AccordionSection id="land-movement" title={t('analytics.movement')} expanded={openSection === 'movement'} chevron lockWhenExpanded className="land-section build-section" toggleClassName="build-section-toggle" contentClassName="build-section-items" onToggle={() => setOpenSection('movement')}>
        {layerItems(movementLayers)}
      </AccordionSection>
      <AccordionSection id="land-data" title={t('analytics.data')} expanded={openSection === 'data'} chevron lockWhenExpanded className="land-section build-section" toggleClassName="build-section-toggle" contentClassName="build-section-items" onToggle={() => setOpenSection('data')}>
        {layerItems(dataLayers)}
      </AccordionSection>
    </>
  );
}
