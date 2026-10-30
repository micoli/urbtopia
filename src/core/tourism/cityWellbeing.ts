import type { GameState } from '../engine/state';
import { cityBenefits } from '../environment/wellbeing';

const ratioByState = new WeakMap<GameState, number>();

// Mean Well-being, from 0 to 1: the preview of each Artist on offer asks for it on the same state.
export function cityWellbeingRatio(state: GameState): number {
  const known = ratioByState.get(state);
  if (known !== undefined) return known;
  const ratio = Math.min(1, Math.max(0, cityBenefits(state).wellbeing / 100));
  ratioByState.set(state, ratio);
  return ratio;
}
