import { DATA_LAYERS, MOVEMENT_LAYERS, SERVICE_CATEGORIES, type AnalyticsLayerId, type ServiceCategory } from '../../core';

export interface AnalyticsEntry {
  layer: AnalyticsLayerId;
  category?: ServiceCategory;
}

export const movementLayers: readonly AnalyticsLayerId[] = MOVEMENT_LAYERS.map(layer => `movement.${layer}` as const);
export const dataLayers: readonly AnalyticsLayerId[] = DATA_LAYERS.filter(layer => layer !== 'coverage').map(layer => `data.${layer}` as const);

// The order of the Land menu.
export const ANALYTICS_ORDER: readonly AnalyticsEntry[] = [
  ...movementLayers.map(layer => ({ layer })),
  ...dataLayers.map(layer => ({ layer })),
  ...SERVICE_CATEGORIES.map(category => ({ layer: 'data.coverage' as const, category })),
];

export function stepAnalytics(layer: AnalyticsLayerId, category: ServiceCategory, delta: 1 | -1): AnalyticsEntry {
  const index = ANALYTICS_ORDER.findIndex(entry => entry.layer === layer && (layer !== 'data.coverage' || entry.category === category));
  return ANALYTICS_ORDER[(index + delta + ANALYTICS_ORDER.length) % ANALYTICS_ORDER.length]!;
}
