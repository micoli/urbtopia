import { describe, expect, it } from 'vitest';
import { ANALYTICS_ORDER, stepAnalytics } from './analyticsOrder';

describe('analytics order', () => {
  it('follows the Land menu: Movement, Data, then one entry per service category', () => {
    expect(ANALYTICS_ORDER[0]).toEqual({ layer: 'movement.pedestrians' });
    expect(ANALYTICS_ORDER[2]).toEqual({ layer: 'movement.bus' });
    expect(ANALYTICS_ORDER[6]).toEqual({ layer: 'movement.flows' });
    expect(ANALYTICS_ORDER[7]).toEqual({ layer: 'data.wellbeing' });
    expect(ANALYTICS_ORDER.at(-1)).toEqual({ layer: 'data.coverage', category: 'waste' });
  });

  it('steps through the categories of the coverage layer', () => {
    expect(stepAnalytics('data.coverage', 'education', 1)).toEqual({ layer: 'data.coverage', category: 'administration' });
    expect(stepAnalytics('data.landValue', 'education', 1)).toEqual({ layer: 'data.coverage', category: 'education' });
  });

  it('wraps around both ends', () => {
    expect(stepAnalytics('data.coverage', 'waste', 1)).toEqual({ layer: 'movement.pedestrians' });
    expect(stepAnalytics('movement.pedestrians', 'education', -1)).toEqual({ layer: 'data.coverage', category: 'waste' });
  });
});
