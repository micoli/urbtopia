import { describe, expect, it } from 'vitest';
import { ANALYTICS_LAYERS } from '../../core';
import { legendsOf } from './layerLegends';

describe('layer legends', () => {
  it('reads congestion in percent of capacity', () => {
    expect(legendsOf('data.congestion')).toEqual([expect.objectContaining({ max: 200, suffix: '%' })]);
  });

  it('shows one legend for Roads, one for Sidewalks and one for Crossings in All', () => {
    expect(legendsOf('movement.all').map(legend => legend.label)).toEqual(['roads', 'sidewalks', 'crossings']);
  });

  it('has at least one legend for every Layer', () => {
    expect(ANALYTICS_LAYERS.filter(layer => legendsOf(layer).length === 0)).toEqual([]);
  });
});
