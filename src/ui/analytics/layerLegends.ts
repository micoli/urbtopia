import { ECOLOGY, WASTE_FACILITIES, type AnalyticsLayerId } from '../../core';
import { LAYER_RAMPS, type RampId } from '../../scene/analyticsRamps';

export interface LayerLegend {
  ramp: RampId;
  max: number;
}

const MAXIMA: Partial<Record<AnalyticsLayerId, number>> = {
  'data.pollution': ECOLOGY.coalWellbeingCap,
  'data.odor': WASTE_FACILITIES.mound.odor?.malus,
};

export function legendOf(layer: AnalyticsLayerId): LayerLegend | null {
  const ramp = LAYER_RAMPS[layer], max = MAXIMA[layer];
  return ramp && max !== undefined ? { ramp, max } : null;
}
