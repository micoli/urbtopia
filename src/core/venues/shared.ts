import venues from '../../../assets/defs/balance/venues.json' with { type: 'json' };
import { citizensOf } from '../buildings/city';
import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import type { Building, GameState, VenueType } from '../engine/state';
import { venueTierOf } from './profiles';
import { isHomeType } from '../buildings/buildingDefinitions';
import { layoutOf } from '../buildings/buildingIndex';

export const VENUE = { hourMs: 3_600_000, ...venues.venue };

// The entrance stays on the same cell of the north wall at every Tier, so growing the grid never moves it under a Fixture.
export const entranceCell = (_tier = 1): { x: number; y: number } => ({ x: 3, y: 0 });

export const gridSizeOf = (type: VenueType, tier: number): number => venueTierOf(type, tier).gridSize!;

export const takingsCapOf = (type: VenueType, tier: number): number => venueTierOf(type, tier).takingsCap!;

export const priceAcceptance = (price: number): number => Math.min(1, Math.max(0, 1 - VENUE.priceTolerance * (price - VENUE.playPrice)));

const neighbourhoodCache = new WeakMap<object, Map<number, number>>();

function neighbourhoodCitizens(state: GameState, venue: Building): number {
  const layout = layoutOf(state.buildings);
  const known = neighbourhoodCache.get(layout) ?? new Map<number, number>();
  neighbourhoodCache.set(layout, known);
  const cached = known.get(venue.id);
  if (cached !== undefined) return cached;
  const to = centerOf(venue);
  const citizens = state.buildings.reduce((total, home) => {
    if (!isHomeType(home.type)) return total;
    const from = centerOf(home);
    return isWithinReach(from.x - to.x, from.y - to.y, VENUE.reachRadius) ? total + citizensOf(home.tier) : total;
  }, 0);
  known.set(venue.id, citizens);
  return citizens;
}

export function neighbourhoodVisitors(state: GameState, venue: Building, perCitizen: number): number {
  return neighbourhoodCitizens(state, venue) * perCitizen;
}
