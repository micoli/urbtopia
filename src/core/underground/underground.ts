import { citizenCount } from '../environment/ecology';
import type { GameState } from '../engine/state';
import type { Level } from '../map/level';
import { TRANSIT } from '../transit/transitNetwork';

export const UNDERGROUND = {
  // Walkways open after the Footbridge, which opens at 120 Citizens.
  walkwayUnlockCitizens: 200,
};

export function undergroundUnlocked(state: GameState): boolean {
  return citizenCount(state) >= UNDERGROUND.walkwayUnlockCitizens;
}

// Level -1 opens with the walkways, Level -2 with the Metro.
export function levelUnlocked(state: GameState, level: Level): boolean {
  if (level === 0) return true;
  return citizenCount(state) >= (level === -1 ? UNDERGROUND.walkwayUnlockCitizens : TRANSIT.metro.unlock);
}
