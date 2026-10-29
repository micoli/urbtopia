import { ECOLOGY } from '../environment/ecology';
import { CONGESTION } from '../traffic/roadTier';
import { WASTE_FACILITIES } from '../waste/wasteBalance';
import type { AnalyticsLayerId } from './layers';

export type RampId = 'value' | 'heat' | 'odor' | 'road' | 'sidewalk' | 'saturation' | 'coverage' | 'wellbeing' | 'bus' | 'brt' | 'rail';
export type ScaleLabel = 'roads' | 'sidewalks' | 'crossings' | 'bus' | 'brt' | 'rail';

export interface LayerScale {
  ramp: RampId;
  // A number, the busiest tile of the city when relative, or three fixed states when discrete.
  max: number | 'relative' | 'discrete';
  suffix?: string;
  label?: ScaleLabel;
}

// One scale per field drawn by a Layer, in drawing order.
export const LAYER_SCALES: Partial<Record<AnalyticsLayerId, readonly LayerScale[]>> = {
  'data.coverage': [{ ramp: 'coverage', max: 'discrete' }],
  'data.wellbeing': [{ ramp: 'wellbeing', max: 100 }],
  'data.landValue': [{ ramp: 'value', max: 100 }],
  'data.pollution': [{ ramp: 'heat', max: ECOLOGY.coalWellbeingCap }],
  'data.odor': [{ ramp: 'odor', max: WASTE_FACILITIES.mound.odor?.malus ?? 1 }],
  'data.congestion': [{ ramp: 'saturation', max: CONGESTION.maxRatio * 100, suffix: '%' }],
  'movement.cars': [{ ramp: 'road', max: 'relative' }],
  'movement.bus': [{ ramp: 'bus', max: 'relative', label: 'bus' }],
  'movement.brt': [{ ramp: 'brt', max: 'relative', label: 'brt' }],
  'movement.rail': [{ ramp: 'rail', max: 'relative', label: 'rail' }],
  'movement.pedestrians': [{ ramp: 'sidewalk', max: 'relative', label: 'sidewalks' }, { ramp: 'saturation', max: 100, suffix: '%', label: 'crossings' }],
  'movement.all': [{ ramp: 'road', max: 'relative', label: 'roads' }, { ramp: 'sidewalk', max: 'relative', label: 'sidewalks' }, { ramp: 'saturation', max: 100, suffix: '%', label: 'crossings' }, { ramp: 'bus', max: 'relative', label: 'bus' }, { ramp: 'brt', max: 'relative', label: 'brt' }, { ramp: 'rail', max: 'relative', label: 'rail' }],
};
