import { describe, expect, it } from 'vitest';
import type { FlatBuilding } from '../buildings/buildingDefinition';
import { descriptionProblemsOf } from './descriptionProblems';
import { descriptionValuesOf } from './descriptionValues';
import { placeholdersOf, renderDescription } from './messageFormat';

const facility = {
  kind: 'facility',
  name: { en: 'School', fr: 'École' },
  radius: 10,
  power: 2,
  water: 0,
  cost: 300,
  tiers: [{ capacity: 300 }, { capacity: 500, upgradeCost: { urbs: 10 } }],
} as unknown as FlatBuilding;

describe('description values', () => {
  it('offer the numbers of the object, of its first and highest Tier, and the Tier count', () => {
    expect(descriptionValuesOf(facility)).toMatchObject({ cost: 300, tierCount: 2, tier1Capacity: 300, maxTierCapacity: 500, side: 20, reach: 'square', limit: 'limited', hasWater: 'no' });
  });

  it('leave the capacity out of a facility without one', () => {
    const townHall = { ...facility, radius: undefined, tiers: [{}] } as unknown as FlatBuilding;
    expect(descriptionValuesOf(townHall)).toMatchObject({ reach: 'city', limit: 'unlimited' });
    expect(descriptionValuesOf(townHall)).not.toHaveProperty('tier1Capacity');
  });
});

describe('description templates', () => {
  it('render the same sentence in both languages', () => {
    const template = { en: '{reach, select, city {Whole city} other {Reach of {side} tiles}}, up to {maxTierCapacity} at Tier {tierCount}', fr: 'Portée de {side} cases' };
    expect(renderDescription(template.en, 'en', descriptionValuesOf(facility))).toBe('Reach of 20 tiles, up to 500 at Tier 2');
    expect(renderDescription(template.fr, 'fr', descriptionValuesOf(facility))).toBe('Portée de 20 cases');
  });

  it('list the placeholders they use, even inside a choice', () => {
    expect(placeholdersOf('{a, select, x {{b} left} other {{c}}} {d}')).toEqual({ placeholders: ['a', 'b', 'c', 'd'] });
  });

  it('are refused when a placeholder is unknown or the message is malformed', () => {
    const described = (en: string) => ({ ...facility, description: { en, fr: 'ok' } }) as unknown as FlatBuilding;
    expect(descriptionProblemsOf(described('costs {cost} Urbs'))).toEqual([]);
    expect(descriptionProblemsOf(described('costs {price} Urbs'))).toEqual([{ path: 'description.en', message: 'unknown placeholder {price}' }]);
    expect(descriptionProblemsOf(described('costs {cost')).map(problem => problem.path)).toEqual(['description.en']);
  });
});
