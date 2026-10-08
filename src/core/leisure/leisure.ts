import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import { casinoRadius, casinoWellbeingBonus } from './casino';
import { SPORT_VENUES, isSportVenueType, type SportVenueType } from './sportVenues';
import { BOATS, boatTier, boatsOf, isBoatOperating } from '../water/boats';
import type { Building, GameState } from '../engine/state';

export function casinosReaching(state: GameState, home: Building, powered: ReadonlySet<number>): Building[] {
  const to = centerOf(home);
  return state.buildings.filter(building => {
    if (building.type !== 'casino' || !powered.has(building.id)) return false;
    const from = centerOf(building);
    return isWithinReach(to.x - from.x, to.y - from.y, casinoRadius(building.tier));
  });
}

export function sportVenuesReaching(state: GameState, home: Building): Building[] {
  const to = centerOf(home);
  return state.buildings.filter(building => {
    if (!isSportVenueType(building.type)) return false;
    const from = centerOf(building);
    return isWithinReach(to.x - from.x, to.y - from.y, SPORT_VENUES[building.type].radius);
  });
}

export function pleasureBoatsReaching(state: GameState, home: Building): number {
  const to = centerOf(home);
  return boatsOf(state).filter(boat => {
    if (boat.family !== 'pleasure' || !isBoatOperating(state, boat)) return false;
    return isWithinReach(to.x - (boat.x + 0.5), to.y - (boat.y + 0.5), BOATS.pleasure.radius);
  }).length;
}

export function leisureRetention(state: GameState, home: Building, powered: ReadonlySet<number>, limit: number): number {
  const to = centerOf(home);
  const fromCasinos = casinosReaching(state, home, powered).reduce((retained, casino) => retained * (1 - casinoWellbeingBonus(casino.tier) / limit), 1);
  const casinoBoats = boatsOf(state).filter(boat => boat.family === 'casino' && isBoatOperating(state, boat) && isWithinReach(to.x - (boat.x + 0.5), to.y - (boat.y + 0.5), casinoRadius(boatTier(boat))));
  const fromBoats = casinoBoats.reduce((retained, boat) => retained * (1 - casinoWellbeingBonus(boatTier(boat)) / limit), fromCasinos);
  const withSport = sportVenuesReaching(state, home).reduce((retained, venue) => retained * (1 - SPORT_VENUES[venue.type as SportVenueType].wellbeingBonus / limit), fromBoats);
  return withSport * (1 - BOATS.pleasure.wellbeingBonus / limit) ** pleasureBoatsReaching(state, home);
}
