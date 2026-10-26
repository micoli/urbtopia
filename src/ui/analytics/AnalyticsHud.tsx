import { useEffect } from 'react';
import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { NavActionButton } from '../layout/NavActionButton';
import { AnalyticsFlows } from './AnalyticsFlows';
import { AnalyticsLegend } from './AnalyticsLegend';
import type { AnalyticsLayerId, ServiceCategory } from '../../core';
import { ANALYTICS_ORDER, stepAnalytics } from './analyticsOrder';
import { legendsOf } from './layerLegends';

function LayerSummary({ layer, category }: { layer: AnalyticsLayerId; category: ServiceCategory }) {
  return (
    <>
      <strong className="analytics-hud-title">{t(`analytics.layer.${layer}`)}{layer === 'data.coverage' ? ` · ${t(`service.${category}`)}` : ''}</strong>
      {legendsOf(layer).map((legend, index) => <AnalyticsLegend key={index} legend={legend} />)}
    </>
  );
}

export function AnalyticsHud() {
  const layer = useUi(store => store.analyticsLayer);
  const category = useUi(store => store.analyticsCategory);
  const exitAnalytics = useUi(store => store.exitAnalytics);
  const enterAnalytics = useUi(store => store.enterAnalytics);

  useEffect(() => {
    if (!layer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exitAnalytics();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [layer, exitAnalytics]);

  if (!layer) return null;
  const go = (delta: 1 | -1) => {
    const { layer: next, category: nextCategory } = stepAnalytics(layer, category, delta);
    enterAnalytics(next, nextCategory);
  };
  return (
    <div className="analytics-hud">
      <div className="analytics-widget">
        <NavActionButton variant="dock" action={{ id: 'exit', icon: '↩', label: t('analytics.exit'), pressed: false, disabled: false, guided: false, onClick: exitAnalytics }} />
        <button type="button" className="analytics-step" aria-label={t('analytics.previous')} onClick={() => go(-1)}>‹</button>
        <div className="analytics-legends">
          {ANALYTICS_ORDER.map(entry => (
            <div key={`${entry.layer}-${entry.category ?? ''}`} className="analytics-ghost" aria-hidden="true" inert>
              <LayerSummary layer={entry.layer} category={entry.category ?? category} />
            </div>
          ))}
          <div className="analytics-current">
            <LayerSummary layer={layer} category={category} />
          </div>
        </div>
        <button type="button" className="analytics-step" aria-label={t('analytics.next')} onClick={() => go(1)}>›</button>
      </div>
      <AnalyticsFlows />
    </div>
  );
}
