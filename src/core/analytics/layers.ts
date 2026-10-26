export const MOVEMENT_LAYERS = ['pedestrians', 'cars', 'all'] as const;
export const DATA_LAYERS = ['coverage', 'wellbeing', 'pollution', 'congestion', 'odor', 'landValue'] as const;

export type MovementLayer = typeof MOVEMENT_LAYERS[number];
export type DataLayer = typeof DATA_LAYERS[number];
export type AnalyticsLayerId = `movement.${MovementLayer}` | `data.${DataLayer}`;

export const ANALYTICS_LAYERS: readonly AnalyticsLayerId[] = [
  ...MOVEMENT_LAYERS.map((layer): AnalyticsLayerId => `movement.${layer}`),
  ...DATA_LAYERS.map((layer): AnalyticsLayerId => `data.${layer}`),
];

export function isAnalyticsLayerId(value: unknown): value is AnalyticsLayerId {
  return ANALYTICS_LAYERS.some(layer => layer === value);
}
