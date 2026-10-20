import { difficultyOf } from '../engine/difficulty';
import { hashSeed } from '../engine/random';
import type { GameState } from '../engine/state';

export interface PoliticsState {
  rngState: number;
}

const POLITICS_STREAM = 'politics';

export function isPoliticsActive(state: GameState): boolean {
  if (difficultyOf(state) === 'cozy') return false;
  return state.buildings.some(building => building.type === 'townHall');
}

export function withPolitics(state: GameState): GameState {
  if (state.politics || !isPoliticsActive(state)) return state;
  return { ...state, politics: { rngState: hashSeed(`${state.seed}:${POLITICS_STREAM}`) } };
}
