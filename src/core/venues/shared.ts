import venues from '../../../assets/defs/balance/venues.json' with { type: 'json' };
import { citizensOf } from '../buildings/city';
import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import type { Building, GameState, VenueType } from '../engine/state';
import { venueTierOf } from './profiles';

export const VENUE = { hourMs: 3_600_000, ...venues.venue };

// The entrance stays on the same cell of the north wall at every Tier, so growing the grid never moves it under a Fixture.
export const entranceCell = (_tier = 1): { x: number; y: number } => ({ x: 3, y: 0 });

export const gridSizeOf = (type: VenueType, tier: number): number => venueTierOf(type, tier).gridSize!;

export const takingsCapOf = (type: VenueType, tier: number): number => venueTierOf(type, tier).takingsCap!;

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
