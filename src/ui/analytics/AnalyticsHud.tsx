import { useEffect } from 'react';
import { t } from '../../i18n/t';
import { ActionButton } from '../common/ActionButton';
import { useUi } from '../common/hooks';

export function AnalyticsHud() {
  const layer = useUi(store => store.analyticsLayer);
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
  return (
    <div className="analytics-hud">
      <strong className="analytics-hud-title">{t(`analytics.layer.${layer}`)}</strong>
      <ActionButton variant="primary" onClick={exitAnalytics}>{t('analytics.exit')}</ActionButton>
    </div>
  );
}
