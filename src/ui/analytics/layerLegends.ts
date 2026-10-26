import { CONGESTION, ECOLOGY, WASTE_FACILITIES, type AnalyticsLayerId } from '../../core';
import { LAYER_RAMPS, type RampId } from '../../scene/analyticsRamps';

export interface LayerLegend {
  ramp: RampId;
  // A number, or the busiest tile of the city when the scale is relative.
  max: number | 'relative';
  suffix?: string;
}

const MAXIMA: Partial<Record<AnalyticsLayerId, Pick<LayerLegend, 'max' | 'suffix'>>> = {
  'data.pollution': { max: ECOLOGY.coalWellbeingCap },
  'data.odor': { max: WASTE_FACILITIES.mound.odor?.malus ?? 0 },
  'movement.cars': { max: 'relative' },
  'data.congestion': { max: CONGESTION.maxRatio * 100, suffix: '%' },
};

export function legendOf(layer: AnalyticsLayerId): LayerLegend | null {
  const ramp = LAYER_RAMPS[layer], scale = MAXIMA[layer];
  return ramp && scale ? { ramp, ...scale } : null;
}
