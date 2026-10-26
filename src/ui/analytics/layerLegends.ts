import { ECOLOGY, type AnalyticsLayerId } from '../../core';
import type { RampId } from '../../scene/analyticsRamps';

export interface LayerLegend {
  ramp: RampId;
  max: number;
}

export const LAYER_LEGENDS: Partial<Record<AnalyticsLayerId, LayerLegend>> = {
  'data.pollution': { ramp: 'heat', max: ECOLOGY.coalWellbeingCap },
};
