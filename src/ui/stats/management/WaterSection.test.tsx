import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, utilityDemand, waterDemandSplit } from '../../../core';
import { WaterSection } from './WaterSection';

describe('Water section', () => {
  const state = { ...newGame({ seed: 'water', now: 0 }), buildings: [{ ...createBuilding(1, 'home', 55, 57, 0), tier: 2 }, createBuilding(2, 'home', 58, 57, 0)] };

  it('splits the demand between citizens and agriculture, the parts adding up to the total', () => {
    const split = waterDemandSplit(state);
    expect(split.citizens).toBeGreaterThan(0);
    expect(split.citizens + split.agriculture).toBe(utilityDemand(state).water);
  });

  it('shows both parts', () => {
    const html = renderToStaticMarkup(<WaterSection state={state} />);
    expect(html).toContain('Citizens (Homes and public facilities)');
    expect(html).toContain('Agriculture (Crops and Orchards)');
  });
});
