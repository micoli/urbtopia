import { describe, expect, it } from 'vitest';
import interiors from '../../../assets/defs/balance/interiors.json' with { type: 'json' };
import { FIXTURES } from '../venues/fixtures';
import { PRODUCTION_INTERIOR_KINDS, SERVICE_INTERIOR_KINDS } from '../venues/venueVocabulary';
import { interiorKindOf } from '../factory/interiorCommands';
import { hasProductionInteriorType, interiorProfileOf } from './interiorProfile';
import { interiorFixtureKindOf } from './interiorStaff';

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


// Taken from the code before the caps and the Technician posts moved into the profile.
const NUMBERS_BY_TIER_1_TO_10: { type: Parameters<typeof interiorProfileOf>[0]; speed: number[]; yield: number[]; sales?: number[]; capacity?: number[]; technicians: number[] }[] = [
  { type: 'factory', speed: [0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], yield: [0.05, 0.1, 0.15, 0.2, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25], technicians: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2] },
  { type: 'packhouse', speed: [0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], yield: [0.05, 0.1, 0.15, 0.2, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25], technicians: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2] },
  { type: 'mill', speed: [0.1, 0.18, 0.26, 0.34, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42], yield: [0.02, 0.04, 0.06, 0.08, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], technicians: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2] },
  { type: 'workshop', speed: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01], yield: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01], technicians: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2] },
  { type: 'recyclingPlant', speed: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01], yield: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01], technicians: [1, 2, 3, 4, 4, 4, 4, 4, 4, 4] },
  { type: 'bakery', speed: [0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], yield: [0.02, 0.04, 0.06, 0.08, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], sales: [0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], technicians: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2] },
  { type: 'dairy', speed: [0.05, 0.1, 0.15, 0.2, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25], yield: [0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], technicians: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2] },
  { type: 'storehouse', speed: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05], yield: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05], capacity: [0.1, 0.1, 0.15, 0.15, 0.2, 0.2, 0.25, 0.25, 0.3, 0.3], technicians: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2] },
  { type: 'textileMill', speed: [0.1, 0.18, 0.26, 0.34, 0.42, 0.42, 0.42, 0.42, 0.42, 0.42], yield: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01], technicians: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2] },
  { type: 'knitwearFactory', speed: [0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], yield: [0.02, 0.04, 0.06, 0.08, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1], sales: [0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5], technicians: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2] },
  { type: 'livestockFarm', speed: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01], yield: [0.05, 0.1, 0.15, 0.2, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25], technicians: [0, 0, 1, 1, 2, 2, 2, 2, 2, 2] },
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

  it.each(NUMBERS_BY_TIER_1_TO_10)('gives a $type the caps of its bonus and the posts of its Technician at every Tier', ({ type, speed, yield: yields, sales, capacity, technicians }) => {
    const profile = interiorProfileOf(type);
    const tiers = speed.map((_, index) => index + 1);
    expect(tiers.map(tier => profile?.caps(tier).speed)).toEqual(speed);
    expect(tiers.map(tier => profile?.caps(tier).yield)).toEqual(yields);
    expect(tiers.map(tier => profile?.caps(tier).sales)).toEqual(sales ?? tiers.map(() => undefined));
    expect(tiers.map(tier => profile?.caps(tier).capacity)).toEqual(capacity ?? tiers.map(() => undefined));
    expect(tiers.map(tier => profile?.technicianPosts(tier))).toEqual(technicians);
  });

  it.each(['school', 'library', 'hospital', 'home'] as const)('gives a %s no cap and no Technician', type => {
    const profile = interiorProfileOf(type);
    expect(profile?.caps(3)).toEqual({ speed: 0, yield: 0 });
    expect(profile?.technicianPosts(3)).toBe(0);
  });

  it.each([
    { type: 'factory', model: 'factory' },
    { type: 'packhouse', model: 'packhouse' },
    { type: 'mill', model: 'machines' },
    { type: 'textileMill', model: 'machines' },
    { type: 'workshop', model: 'line' },
    { type: 'recyclingPlant', model: 'line' },
    { type: 'dairy', model: 'line' },
    { type: 'storehouse', model: 'line' },
    { type: 'livestockFarm', model: 'line' },
    { type: 'bakery', model: 'assigned' },
    { type: 'knitwearFactory', model: 'assigned' },
  ] as const)('computes the bonus of a $type with the $model model', ({ type, model }) => {
    expect(interiorProfileOf(type)?.bonusModel).toBe(model);
  });

  it.each(['school', 'library', 'hospital', 'home'] as const)('has no bonus model for a %s', type => {
    expect(interiorProfileOf(type)?.bonusModel).toBeUndefined();
  });

  it.each(['vault', 'materialDepot'] as const)('runs the Storehouse interior in a %s', type => {
    expect(interiorFixtureKindOf(type)).toBe('storehouse');
    expect(interiorKindOf({ type } as Parameters<typeof interiorKindOf>[0])).toBe('storehouse');
    expect(interiorProfileOf(type)?.family).toBe('production');
    expect(interiorProfileOf(type)?.bonusModel).toBe(interiorProfileOf('storehouse')?.bonusModel);
    expect(hasProductionInteriorType(type)).toBe(true);
  });

  it('keeps the kind of Fixtures of a type that declares none', () => {
    expect(interiorFixtureKindOf('storehouse')).toBe('storehouse');
  });

  it('gives nothing to a type of building with no interior', () => {
    expect(interiorProfileOf('farm')).toBeUndefined();
  });

  it.each([
    { family: 'production', kinds: PRODUCTION_INTERIOR_KINDS },
    { family: 'service', kinds: SERVICE_INTERIOR_KINDS },
  ] as const)('lists as $family kinds exactly the types that interiors.json declares in that family with Fixtures of their own', ({ family, kinds }) => {
    const declared = Object.entries(interiors.buildings)
      .filter(([, declaration]) => declaration.family === family && !('fixtureKind' in declaration))
      .map(([type]) => type);
    expect([...kinds].sort()).toEqual(declared.sort());
  });

  it('gives a profile to every kind of Fixtures that a Production or Service interior takes', () => {
    const kinds = new Set<string>([...PRODUCTION_INTERIOR_KINDS, ...SERVICE_INTERIOR_KINDS]);
    const venues = new Set(Object.values(FIXTURES).map(fixture => fixture.venue).filter(venue => kinds.has(venue)));
    expect([...venues].every(venue => interiorProfileOf(venue as Parameters<typeof interiorProfileOf>[0]) !== undefined)).toBe(true);
  });
});
