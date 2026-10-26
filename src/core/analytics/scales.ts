import { ECOLOGY } from '../environment/ecology';
import { CONGESTION } from '../traffic/roadTier';
import { WASTE_FACILITIES } from '../waste/wasteBalance';
import type { AnalyticsLayerId } from './layers';

export type RampId = 'heat' | 'odor' | 'road' | 'sidewalk' | 'saturation';
export type ScaleLabel = 'roads' | 'sidewalks' | 'crossings';

export interface LayerScale {
  ramp: RampId;
  // A number, or the busiest tile of the city when the scale is relative.
  max: number | 'relative';
  suffix?: string;
  label?: ScaleLabel;
}

// One scale per field drawn by a Layer, in drawing order.
export const LAYER_SCALES: Partial<Record<AnalyticsLayerId, readonly LayerScale[]>> = {
  'data.pollution': [{ ramp: 'heat', max: ECOLOGY.coalWellbeingCap }],
  'data.odor': [{ ramp: 'odor', max: WASTE_FACILITIES.mound.odor?.malus ?? 1 }],
  'data.congestion': [{ ramp: 'saturation', max: CONGESTION.maxRatio * 100, suffix: '%' }],
  'movement.cars': [{ ramp: 'road', max: 'relative' }],
  'movement.pedestrians': [{ ramp: 'sidewalk', max: 'relative', label: 'sidewalks' }, { ramp: 'saturation', max: 100, suffix: '%', label: 'crossings' }],
  'movement.all': [{ ramp: 'road', max: 'relative', label: 'roads' }, { ramp: 'sidewalk', max: 'relative', label: 'sidewalks' }, { ramp: 'saturation', max: 100, suffix: '%', label: 'crossings' }],
};
