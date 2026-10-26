import { describe, expect, it } from 'vitest';
import { ANALYTICS_LAYERS } from '../../core';
import { LAYER_RAMPS } from '../../scene/analyticsRamps';
import { legendOf } from './layerLegends';

describe('layer legends', () => {
  it('has a legend for every layer that has a ramp', () => {
    for (const layer of ANALYTICS_LAYERS) expect(legendOf(layer) !== null).toBe(LAYER_RAMPS[layer] !== undefined);
  });

  it('reads congestion in percent of capacity', () => {
    expect(legendOf('data.congestion')).toMatchObject({ max: 200, suffix: '%' });
  });
});
