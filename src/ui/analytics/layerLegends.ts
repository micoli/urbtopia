import { LAYER_SCALES, type AnalyticsLayerId, type LayerScale } from '../../core';

export function legendsOf(layer: AnalyticsLayerId): readonly LayerScale[] {
  return LAYER_SCALES[layer] ?? [];
}
