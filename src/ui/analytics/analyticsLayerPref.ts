import { isAnalyticsLayerId, type AnalyticsLayerId } from '../../core';

export const ANALYTICS_LAYER_KEY = 'urbtopia-analytics-layer';

export function readAnalyticsLayer(): AnalyticsLayerId | null {
  try {
    const stored = localStorage.getItem(ANALYTICS_LAYER_KEY);
    return isAnalyticsLayerId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeAnalyticsLayer(layer: AnalyticsLayerId): void {
  try {
    localStorage.setItem(ANALYTICS_LAYER_KEY, layer);
  } catch {
    return;
  }
}
