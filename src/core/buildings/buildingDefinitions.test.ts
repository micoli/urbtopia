import { describe, expect, it } from 'vitest';
import { FR } from '../../i18n/fr';
import { MESSAGES } from '../../i18n/messages';
import { HOME_FOOTPRINTS } from '../economy/economy';
import { NATURE_TYPES } from '../environment/nature';
import { casinoFootprint } from '../leisure/casino';
import { SPORT_VENUES, SPORT_VENUE_TYPES } from '../leisure/sportVenues';
import { FACILITY_TYPES } from '../services/facilities';
import { BUILDING_SPECS } from './buildingSpecs';
import { BUILDING_ENTRIES, BUILDING_IDS } from './buildingDefinitions';

describe('building definitions from assets/defs/buildings', () => {
  it('gives every building a spec, a name and, outside nature, a description in both languages', () => {
    for (const { id, kind } of BUILDING_ENTRIES) {
      expect(BUILDING_SPECS[id], id).toBeDefined();
      expect(MESSAGES[`building.${id}`], id).toBeTruthy();
      expect(FR[`building.${id}`], id).toBeTruthy();
      if (kind === 'nature') continue;
      expect(MESSAGES[`codex.description.${id}`], id).toBeTruthy();
      expect(FR[`codex.description.${id}`], id).toBeTruthy();
    }
  });

  it('lists every public facility, sport venue and nature element as a building', () => {
    const ids = new Set<string>(BUILDING_IDS);
    for (const type of [...FACILITY_TYPES, ...SPORT_VENUE_TYPES, ...NATURE_TYPES]) expect(ids.has(type), type).toBe(true);
    expect(ids.size).toBe(BUILDING_IDS.length);
  });

  it('agrees with the tier 1 footprint of the buildings that grow', () => {
    const [width, depth] = BUILDING_ENTRIES.find(({ id }) => id === 'home')!.footprint!;
    expect(HOME_FOOTPRINTS[0]).toEqual({ width, depth });
    expect(casinoFootprint(1)).toEqual(BUILDING_SPECS.casino.footprint);
  });

  it.each(SPORT_VENUE_TYPES)('keeps the specs of %s from its definition', (type) => {
    const { cost, footprint } = SPORT_VENUES[type];
    expect(BUILDING_SPECS[type]).toMatchObject({ cost, footprint });
  });
});
