import { useState } from 'react';
import { DATA_LAYERS, MOVEMENT_LAYERS, SERVICE_CATEGORIES, type AnalyticsLayerId } from '../../core';
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
  const lastCategory = useUi(store => store.analyticsCategory);
  const [coverageOpen, setCoverageOpen] = useState(lastLayer === 'data.coverage');
  const [openSection, setOpenSection] = useState<'movement' | 'data'>(lastLayer?.startsWith('data.') ? 'data' : 'movement');

  const layerItems = (layers: readonly AnalyticsLayerId[]) => layers.map(layer => {
    if (layer !== 'data.coverage') return <FlyoutItem key={layer} label={t(`analytics.layer.${layer}`)} selected={layer === lastLayer} onChoose={() => enterAnalytics(layer)} />;
    return (
      <div key={layer}>
        <FlyoutItem label={`${t(`analytics.layer.${layer}`)} ${coverageOpen ? '▾' : '▸'}`} selected={layer === lastLayer} onChoose={() => setCoverageOpen(!coverageOpen)} />
        {coverageOpen ? (
          <div className="flyout-sub">
            {SERVICE_CATEGORIES.map(category => (
              <FlyoutItem key={category} label={t(`service.${category}`)} selected={layer === lastLayer && category === lastCategory} onChoose={() => enterAnalytics(layer, category)} />
            ))}
          </div>
        ) : null}
      </div>
    );
  });

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
