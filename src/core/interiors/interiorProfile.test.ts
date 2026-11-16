import { describe, expect, it } from 'vitest';
import interiors from '../../../assets/defs/balance/interiors.json' with { type: 'json' };
import { FIXTURES } from '../venues/fixtures';
import { PRODUCTION_INTERIOR_KINDS, SERVICE_INTERIOR_KINDS } from '../venues/venueVocabulary';
import { interiorProfileOf } from './interiorProfile';

type Family = NonNullable<ReturnType<typeof interiorProfileOf>>['family'];

const SIZES_BY_TIER_1_TO_10: { type: Parameters<typeof interiorProfileOf>[0]; family: Family; sizes: number[] }[] = [
  { type: 'factory', family: 'production', sizes: [6, 7, 8, 9, 10, 10, 10, 10, 10, 10] },
  { type: 'packhouse', family: 'production', sizes: [6, 7, 8, 9, 10, 10, 10, 10, 10, 10] },
  { type: 'mill', family: 'production', sizes: [5, 6, 7, 8, 9, 9, 9, 9, 9, 9] },
  { type: 'workshop', family: 'production', sizes: [5, 6, 7, 8, 9, 9, 9, 9, 9, 9] },
  { type: 'recyclingPlant', family: 'production', sizes: [5, 6, 7, 8, 8, 8, 8, 8, 8, 8] },
  { type: 'bakery', family: 'production', sizes: [6, 7, 8, 9, 10, 10, 10, 10, 10, 10] },
  { type: 'dairy', family: 'production', sizes: [6, 7, 8, 9, 10, 10, 10, 10, 10, 10] },
  { type: 'storehouse', family: 'production', sizes: [6, 6, 7, 7, 8, 8, 9, 9, 10, 10] },
  { type: 'textileMill', family: 'production', sizes: [5, 6, 7, 8, 9, 9, 9, 9, 9, 9] },
  { type: 'knitwearFactory', family: 'production', sizes: [6, 7, 8, 9, 10, 10, 10, 10, 10, 10] },
  { type: 'livestockFarm', family: 'production', sizes: [6, 7, 8, 9, 10, 10, 10, 10, 10, 10] },
  { type: 'home', family: 'home', sizes: [4, 4, 5, 5, 6, 6, 7, 7, 7, 7] },
  { type: 'home-victorian', family: 'home', sizes: [4, 4, 5, 5, 6, 6, 7, 7, 7, 7] },
  { type: 'school', family: 'service', sizes: [5, 5, 6, 6, 7, 7, 8, 8, 8, 8] },
  { type: 'library', family: 'service', sizes: [5, 6, 7, 8, 9, 9, 9, 9, 9, 9] },
  { type: 'hospital', family: 'service', sizes: [5, 5, 6, 6, 7, 7, 8, 8, 8, 8] },
];

describe('the Interior profile of a type of building', () => {
  it.each(SIZES_BY_TIER_1_TO_10)('gives a $type its $family family and the size of its room at every Tier', ({ type, family, sizes }) => {
    const profile = interiorProfileOf(type);
    expect(profile?.family).toBe(family);
    expect(sizes.map((_, index) => profile?.gridSize(index + 1))).toEqual(sizes);
  });

  it.each(['packhouse', 'workshop', 'recyclingPlant', 'bakery', 'dairy', 'storehouse', 'knitwearFactory', 'livestockFarm'] as const)('runs a Line of crates in the interior of a %s', type => {
    expect(interiorProfileOf(type)?.line).toBe(true);
  });

  it.each(['factory', 'mill', 'textileMill', 'school', 'library', 'hospital', 'home'] as const)('runs no Line of crates in the interior of a %s', type => {
    expect(interiorProfileOf(type)?.line).toBe(false);
  });

  it('gives nothing to a type of building with no interior', () => {
    expect(interiorProfileOf('farm')).toBeUndefined();
  });

  it.each([
    { family: 'production', kinds: PRODUCTION_INTERIOR_KINDS },
    { family: 'service', kinds: SERVICE_INTERIOR_KINDS },
  ] as const)('lists as $family kinds exactly the types that interiors.json declares in that family', ({ family, kinds }) => {
    const declared = Object.entries(interiors.buildings).filter(([, declaration]) => declaration.family === family).map(([type]) => type);
    expect([...kinds].sort()).toEqual(declared.sort());
  });

  it('gives a profile to every kind of Fixtures that a Production or Service interior takes', () => {
    const kinds = new Set<string>([...PRODUCTION_INTERIOR_KINDS, ...SERVICE_INTERIOR_KINDS]);
    const venues = new Set(Object.values(FIXTURES).map(fixture => fixture.venue).filter(venue => kinds.has(venue)));
    expect([...venues].every(venue => interiorProfileOf(venue as Parameters<typeof interiorProfileOf>[0]) !== undefined)).toBe(true);
  });
});
