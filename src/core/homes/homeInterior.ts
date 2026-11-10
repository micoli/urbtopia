import homeBalance from '../../../assets/defs/balance/homeInterior.json' with { type: 'json' };
import { citizenCount } from '../environment/ecology';
import type { Building, FixtureId, GameState, VenueFixture } from '../engine/state';
import { FIXTURES } from '../venues/fixtures';
import { fixtureTiles } from '../venues/venues';

export const HOME_INTERIOR = homeBalance;

const capOf = (values: readonly number[], tier: number): number => values[Math.min(tier, values.length) - 1] ?? 0;

export type ComfortGroup = keyof typeof homeBalance.weights;

export const COMFORT_GROUPS = Object.keys(homeBalance.weights) as ComfortGroup[];

const WEIGHT_TOTAL = COMFORT_GROUPS.reduce((sum, group) => sum + homeBalance.weights[group], 0);

export const homeGridSizeOf = (tier: number): number => capOf(homeBalance.gridSizes, tier);

export const homeWellbeingCapOf = (tier: number): number => capOf(homeBalance.wellbeingCaps, tier);

// Homes can be furnished once the city has grown to a number of Citizens.
export const isHomeInteriorUnlocked = (state: GameState): boolean => citizenCount(state) >= homeBalance.unlockCitizens;

export const homeFixtureRefund = (type: FixtureId): number => Math.floor(FIXTURES[type].price * homeBalance.refundRatio);

const withRole = (fixtures: readonly VenueFixture[], role: string): VenueFixture[] => fixtures.filter(fixture => FIXTURES[fixture.type].role === role);

const distanceBetween = (a: VenueFixture, b: VenueFixture): number => {
  const bTiles = fixtureTiles(b);
  return Math.min(...fixtureTiles(a).flatMap(from => bTiles.map(to => Math.max(Math.abs(from.x - to.x), Math.abs(from.y - to.y)))));
};

const eaten = (fixtures: readonly VenueFixture[]): boolean => {
  const chairs = withRole(fixtures, 'chair');
  return withRole(fixtures, 'table').some(table => chairs.some(chair => distanceBetween(table, chair) <= homeBalance.chairReach));
};

const presence = (fixtures: readonly VenueFixture[], role: string): number => (withRole(fixtures, role).length > 0 ? 1 : 0);

const sharedWeight = (fixtures: readonly VenueFixture[], role: string): number => withRole(fixtures, role).reduce((sum, fixture) => sum + (FIXTURES[fixture.type].comfort ?? 0), 0);

// Fixtures are replaced, never mutated, so a result stays valid for as long as the same array stands: nothing is recomputed until the interior changes.
const coverageCache = new WeakMap<readonly VenueFixture[], Record<ComfortGroup, number>>();
const comfortCache = new WeakMap<readonly VenueFixture[], number>();

// The share, from 0 to 1, of each group of everyday life that the Fixtures of a Home interior cover.
export function comfortCoverageOf(fixtures: readonly VenueFixture[]): Record<ComfortGroup, number> {
  const cached = coverageCache.get(fixtures);
  if (cached) return cached;
  const coverage = computeCoverage(fixtures);
  coverageCache.set(fixtures, coverage);
  return coverage;
}

function computeCoverage(fixtures: readonly VenueFixture[]): Record<ComfortGroup, number> {
  return {
    sleeping: presence(fixtures, 'bed'),
    washing: (presence(fixtures, 'washer') + presence(fixtures, 'toilet')) / 2,
    eating: eaten(fixtures) ? 1 : 0,
    cooking: (presence(fixtures, 'stove') + presence(fixtures, 'sink')) / 2,
    leisure: Math.min(1, sharedWeight(fixtures, 'leisure')),
    decor: 1 - 0.5 ** (sharedWeight(fixtures, 'decor') / homeBalance.decorHalf),
  };
}

// The Comfort of a Home interior, from 0 to 100.
export function comfortOf(fixtures: readonly VenueFixture[]): number {
  const cached = comfortCache.get(fixtures);
  if (cached !== undefined) return cached;
  const coverage = comfortCoverageOf(fixtures);
  const comfort = Math.round(COMFORT_GROUPS.reduce((sum, group) => sum + homeBalance.weights[group] * coverage[group], 0) / WEIGHT_TOTAL * 100);
  comfortCache.set(fixtures, comfort);
  return comfort;
}

// The Well-being points a Home gains from its interior: its Comfort, as a share of the most its Tier allows. Never negative.
export function comfortBonusOf(home: Pick<Building, 'tier' | 'floor'>): number {
  if (!home.floor) return 0;
  return homeWellbeingCapOf(home.tier) * comfortOf(home.floor.fixtures) / 100;
}
