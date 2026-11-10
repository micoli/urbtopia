import homeBalance from '../../../assets/defs/balance/homeInterior.json' with { type: 'json' };
import type { Building, FixtureId, VenueFixture } from '../engine/state';
import { FIXTURES } from '../venues/fixtures';
import { fixtureTiles } from '../venues/venues';

export const HOME_INTERIOR = homeBalance;

const capOf = (values: readonly number[], tier: number): number => values[Math.min(tier, values.length) - 1] ?? 0;

export type ComfortGroup = keyof typeof homeBalance.weights;

export const COMFORT_GROUPS = Object.keys(homeBalance.weights) as ComfortGroup[];

export const homeGridSizeOf = (tier: number): number => capOf(homeBalance.gridSizes, tier);

export const homeWellbeingCapOf = (tier: number): number => capOf(homeBalance.wellbeingCaps, tier);

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

// The share, from 0 to 1, of each group of everyday life that the Fixtures of a Home interior cover.
export function comfortCoverageOf(fixtures: readonly VenueFixture[]): Record<ComfortGroup, number> {
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
  const coverage = comfortCoverageOf(fixtures);
  const total = COMFORT_GROUPS.reduce((sum, group) => sum + homeBalance.weights[group], 0);
  return Math.round(COMFORT_GROUPS.reduce((sum, group) => sum + homeBalance.weights[group] * coverage[group], 0) / total * 100);
}

// The Well-being points a Home gains from its interior: its Comfort, as a share of the most its Tier allows. Never negative.
export function comfortBonusOf(home: Building): number {
  if (!home.floor) return 0;
  return homeWellbeingCapOf(home.tier) * comfortOf(home.floor.fixtures) / 100;
}
