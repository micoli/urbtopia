import type { Level } from '../map/level';

export const MOVEMENT_LAYERS = ['pedestrians', 'walkways', 'cars', 'bus', 'brt', 'rail', 'metro', 'all', 'flows'] as const;
export const DATA_LAYERS = ['coverage', 'wellbeing', 'pollution', 'congestion', 'odor', 'biodiversity', 'landValue', 'knowledge', 'jobs'] as const;

export type MovementLayer = typeof MOVEMENT_LAYERS[number];
export type DataLayer = typeof DATA_LAYERS[number];
export type AnalyticsLayerId = `movement.${MovementLayer}` | `data.${DataLayer}`;

export const ANALYTICS_LAYERS: readonly AnalyticsLayerId[] = [
  ...MOVEMENT_LAYERS.map((layer): AnalyticsLayerId => `movement.${layer}`),
  ...DATA_LAYERS.map((layer): AnalyticsLayerId => `data.${layer}`),
];

// The Level a Layer reads: the walkways lie on Level -1 and the Metro on Level -2, everything else on the Surface.
export function levelOfLayer(layer: AnalyticsLayerId): Level {
  return layer === 'movement.walkways' ? -1 : layer === 'movement.metro' ? -2 : 0;
}

export function isAnalyticsLayerId(value: unknown): value is AnalyticsLayerId {
  return ANALYTICS_LAYERS.some(layer => layer === value);
}
