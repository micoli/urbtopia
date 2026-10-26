import { t } from '../../i18n/t';
import { RAMPS } from '../../scene/analyticsRamps';
import type { LayerScale } from '../../core';

export function AnalyticsLegend({ legend }: { legend: LayerScale }) {
  return (
    <div className="analytics-legend">
      {legend.label ? <span>{t(`analytics.legend.${legend.label}`)}</span> : null}
      <span>0</span>
      <span className="analytics-legend-ramp" aria-hidden="true" style={{ background: `linear-gradient(to right, ${RAMPS[legend.ramp].join(', ')})` }} />
      <span>{legend.max === 'relative' ? t('analytics.legend.busiest') : `${legend.max}${legend.suffix ?? ''}`}</span>
    </div>
  );
}
