import { useEffect } from 'react';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { useUi } from '../common/hooks';
import { AnalyticsLegend } from './AnalyticsLegend';
import { legendsOf } from './layerLegends';

export function AnalyticsHud() {
  const layer = useUi(store => store.analyticsLayer);
  const category = useUi(store => store.analyticsCategory);
  const exitAnalytics = useUi(store => store.exitAnalytics);

  useEffect(() => {
    if (!layer) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exitAnalytics();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [layer, exitAnalytics]);

  if (!layer) return null;
  const legends = legendsOf(layer);
  return (
    <div className="analytics-hud">
      <strong className="analytics-hud-title">{t(`analytics.layer.${layer}`)}{layer === 'data.coverage' ? ` · ${t(`service.${category}`)}` : ''}</strong>
      <ActionButton variant="primary" onClick={exitAnalytics}>{t('analytics.exit')}</ActionButton>
      {legends.map((legend, index) => <AnalyticsLegend key={index} legend={legend} />)}
    </div>
  );
}
