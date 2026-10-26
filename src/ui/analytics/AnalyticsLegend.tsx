import { RAMPS } from '../../scene/analyticsRamps';
import type { LayerLegend } from './layerLegends';

export function AnalyticsLegend({ legend }: { legend: LayerLegend }) {
  return (
    <div className="analytics-legend">
      <span>0</span>
      <span className="analytics-legend-ramp" aria-hidden="true" style={{ background: `linear-gradient(to right, ${RAMPS[legend.ramp].join(', ')})` }} />
      <span>{legend.max}</span>
    </div>
  );
}
