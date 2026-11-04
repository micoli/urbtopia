import { citizenCount } from '../environment/ecology';
import type { GameState } from '../engine/state';

export const UNDERGROUND = {
  // Walkways open after the Footbridge, which opens at 120 Citizens.
  walkwayUnlockCitizens: 200,
};

export function undergroundUnlocked(state: GameState): boolean {
  return citizenCount(state) >= UNDERGROUND.walkwayUnlockCitizens;
}
