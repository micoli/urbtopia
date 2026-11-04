import { congestionStats, diagnoseCongestion, diagnoseWaste, transportStats, type Cause, type GameState } from '../core';

export function advisorCauses(state: GameState): Cause[] {
  const congestion = congestionStats(state);
  return [...diagnoseCongestion(state, congestion, transportStats(state)).causes, ...diagnoseWaste(state).causes];
}
