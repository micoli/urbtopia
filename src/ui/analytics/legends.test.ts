import { describe, expect, it } from 'vitest';
import { ANALYTICS_LAYERS } from '../../core';
import { legendsOf } from './layerLegends';

describe('layer legends', () => {
  it('reads congestion in percent of capacity', () => {
    expect(legendsOf('data.congestion')).toEqual([expect.objectContaining({ max: 200, suffix: '%' })]);
  });

  it('shows one legend for Roads, Sidewalks, Crossings, Bus, BRT and Rail in All', () => {
    expect(legendsOf('movement.all').map(legend => legend.label)).toEqual(['roads', 'sidewalks', 'crossings', 'bus', 'brt', 'rail']);
  });

  it('has at least one legend for every Layer but the flows of a building, which are listed instead', () => {
    expect(ANALYTICS_LAYERS.filter(layer => legendsOf(layer).length === 0)).toEqual(['movement.flows']);
  });
});
