import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import { casinoRadius, casinoWellbeingBonus } from './casino';
import type { Building, GameState } from '../engine/state';

export function casinosReaching(state: GameState, home: Building, powered: ReadonlySet<number>): Building[] {
  const to = centerOf(home);
  return state.buildings.filter(building => {
    if (building.type !== 'casino' || !powered.has(building.id)) return false;
    const from = centerOf(building);
    return isWithinReach(to.x - from.x, to.y - from.y, casinoRadius(building.tier));
  });
}

export function leisureRetention(state: GameState, home: Building, powered: ReadonlySet<number>, limit: number): number {
  return casinosReaching(state, home, powered).reduce((retained, casino) => retained * (1 - casinoWellbeingBonus(casino.tier) / limit), 1);
}
