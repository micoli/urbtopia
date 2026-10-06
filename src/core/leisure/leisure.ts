import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import { casinoRadius, casinoWellbeingBonus } from './casino';
import { STADIUM } from './stadium';
import type { Building, GameState } from '../engine/state';

export function casinosReaching(state: GameState, home: Building, powered: ReadonlySet<number>): Building[] {
  const to = centerOf(home);
  return state.buildings.filter(building => {
    if (building.type !== 'casino' || !powered.has(building.id)) return false;
    const from = centerOf(building);
    return isWithinReach(to.x - from.x, to.y - from.y, casinoRadius(building.tier));
  });
}

export function stadiumsReaching(state: GameState, home: Building): Building[] {
  const to = centerOf(home);
  return state.buildings.filter(building => {
    if (building.type !== 'stadium') return false;
    const from = centerOf(building);
    return isWithinReach(to.x - from.x, to.y - from.y, STADIUM.radius);
  });
}

export function leisureRetention(state: GameState, home: Building, powered: ReadonlySet<number>, limit: number): number {
  const fromCasinos = casinosReaching(state, home, powered).reduce((retained, casino) => retained * (1 - casinoWellbeingBonus(casino.tier) / limit), 1);
  return stadiumsReaching(state, home).reduce((retained) => retained * (1 - STADIUM.wellbeingBonus / limit), fromCasinos);
}
