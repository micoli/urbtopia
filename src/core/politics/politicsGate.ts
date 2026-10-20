import { difficultyOf } from '../engine/difficulty';
import type { GameState } from '../engine/state';
import { politicsRuleOf } from './politicsBalance';

export function isPoliticsActive(state: GameState): boolean {
  if (!politicsRuleOf(difficultyOf(state)).active) return false;
  return state.buildings.some(building => building.type === 'townHall');
}
