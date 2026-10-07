import { describe, expect, it } from 'vitest';
import { NATURE_TYPES } from '../environment/nature';
import { SPORT_VENUES, SPORT_VENUE_TYPES } from '../leisure/sportVenues';
import { FACILITY_TYPES } from '../services/facilities';
import { BUILDING_SPECS } from './buildingSpecs';

describe('building definitions from models.json', () => {
  it('gives every building type a single owner', () => {
    const ids = [...SPORT_VENUE_TYPES, ...NATURE_TYPES, ...FACILITY_TYPES];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SPORT_VENUE_TYPES)('keeps the specs of %s from its model definition', (type) => {
    const { cost, footprint } = SPORT_VENUES[type];
    expect(BUILDING_SPECS[type]).toMatchObject({ cost, footprint });
  });
});
