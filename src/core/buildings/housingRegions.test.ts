import { describe, expect, it } from 'vitest';
import { BUILDING_ENTRIES } from './buildingDefinitions';
import { HOUSING_REGIONS } from './housingRegions';

const STYLE_BASES = new Set(['home', 'home-building', 'home-mansard-1x1', 'home-mansard-1x2', 'home-mansard-2x2']);

describe('housing regions', () => {
  it('gives every Architecture style of Housing a known region and the base Homes none', () => {
    const homes = BUILDING_ENTRIES.filter(entry => entry.kind === 'home' && !entry.retired);
    for (const entry of homes) {
      if (STYLE_BASES.has(entry.id)) expect(entry.housingRegion, entry.id).toBeUndefined();
      else expect(HOUSING_REGIONS, entry.id).toContain(entry.housingRegion);
    }
  });
});
