import { citizensOf } from '../buildings/city';
import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import type { Building, GameState } from '../engine/state';

export const VENUE = {
  hourMs: 3_600_000,
  reachRadius: 12,
  playPrice: 2,
  minPrice: 1,
  maxPrice: 6,
  priceTolerance: 0.2,
  takingsCaps: [400, 900, 1800] as readonly number[],
  gridSizes: [6, 8, 10] as readonly number[],
  refundRatio: 0.5,
};

// The entrance stays on the same cell of the north wall at every Tier, so growing the grid never moves it under a Fixture.
export const entranceCell = (_tier = 1): { x: number; y: number } => ({ x: 3, y: 0 });

export const gridSizeOf = (tier: number): number => VENUE.gridSizes[tier - 1] ?? VENUE.gridSizes[0]!;

export const takingsCapOf = (tier: number): number => VENUE.takingsCaps[tier - 1] ?? VENUE.takingsCaps[VENUE.takingsCaps.length - 1]!;

export const priceAcceptance = (price: number): number => Math.min(1, Math.max(0, 1 - VENUE.priceTolerance * (price - VENUE.playPrice)));

export function neighbourhoodVisitors(state: GameState, venue: Building, perCitizen: number): number {
  const to = centerOf(venue);
  const citizens = state.buildings.reduce((total, home) => {
    if (home.type !== 'home') return total;
    const from = centerOf(home);
    return isWithinReach(from.x - to.x, from.y - to.y, VENUE.reachRadius) ? total + citizensOf(home.tier) : total;
  }, 0);
  return citizens * perCitizen;
}
