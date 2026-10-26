import { SERVICE_CATEGORIES, isAnalyticsLayerId, type AnalyticsLayerId, type ServiceCategory } from '../../core';

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

export const ANALYTICS_CATEGORY_KEY = 'urbtopia-analytics-category';

export function readAnalyticsCategory(): ServiceCategory {
  try {
    const stored = localStorage.getItem(ANALYTICS_CATEGORY_KEY);
    return SERVICE_CATEGORIES.find(category => category === stored) ?? SERVICE_CATEGORIES[0];
  } catch {
    return SERVICE_CATEGORIES[0];
  }
}

export function writeAnalyticsCategory(category: ServiceCategory): void {
  try {
    localStorage.setItem(ANALYTICS_CATEGORY_KEY, category);
  } catch {
    return;
  }
}
