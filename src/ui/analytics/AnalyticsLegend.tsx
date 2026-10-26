import { COVERAGE_SHARE, type LayerScale } from '../../core';
import { t } from '../../i18n/t';
import { RAMPS, rampColor } from '../../scene/analyticsRamps';

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

function DiscreteLegend({ legend }: { legend: LayerScale }) {
  const states = [['covered', COVERAGE_SHARE.covered], ['viaTransit', COVERAGE_SHARE.viaTransit], ['uncovered', COVERAGE_SHARE.uncovered]] as const;
  return (
    <div className="analytics-legend">
      {states.map(([state, share]) => (
        <span key={state} className="analytics-legend-state">
          <span className="analytics-legend-swatch" aria-hidden="true" style={{ background: hex(rampColor(legend.ramp, share)) }} />
          {t(`analytics.legend.${state}`)}
        </span>
      ))}
    </div>
  );
}

export function AnalyticsLegend({ legend }: { legend: LayerScale }) {
  if (legend.max === 'discrete') return <DiscreteLegend legend={legend} />;
  return (
    <div className="analytics-legend">
      {legend.label ? <span>{t(`analytics.legend.${legend.label}`)}</span> : null}
      <span>0</span>
      <span className="analytics-legend-ramp" aria-hidden="true" style={{ background: `linear-gradient(to right, ${RAMPS[legend.ramp].join(', ')})` }} />
      <span>{legend.max === 'relative' ? t('analytics.legend.busiest') : `${legend.max}${legend.suffix ?? ''}`}</span>
    </div>
  );
}
