import { totalCitizens } from '../buildings/city';
import { difficultyOf } from '../engine/difficulty';
import { nextRandom } from '../engine/random';
import type { GameState } from '../engine/state';
import { approvalOf, type PoliticsState } from './politics';
import { isObjectiveMet } from './objectiveMetrics';
import { OBJECTIVE_ENTRIES, objectiveById, type ObjectiveId } from './objectives';
import { POLITICS, politicsRuleOf } from './politicsBalance';

const MAX_APPROVAL = 100;

export interface ActiveObjective {
  id: ObjectiveId;
  // Consecutive game days the target has been held.
  heldDays: number;
}

// The Grant of an Objective: fixed, except where the Difficulty makes the Approval weigh on it.
export function grantOf(state: GameState, id: ObjectiveId): number {
  const { grant } = objectiveById(id);
  const approval = approvalOf(state);
  if (!politicsRuleOf(difficultyOf(state)).approvalWeighsOnGrants || approval === null) return grant;
  const { atZeroApproval, atFullApproval } = POLITICS.objectives.grantScale;
  return Math.round(grant * (atZeroApproval + (atFullApproval - atZeroApproval) * approval / MAX_APPROVAL));
}

// Fills the free places with Objectives the city is big enough for, drawn from the politics' stream. Once every Objective was done, the cycle starts again.
export function refillObjectives(state: GameState, politics: PoliticsState): PoliticsState {
  let current = politics;
  const citizens = totalCitizens(state);
  while (current.objectives.length < POLITICS.objectives.activeCount) {
    const active = current.objectives.map(({ id }) => id);
    const open = (done: readonly ObjectiveId[]) => OBJECTIVE_ENTRIES.filter(entry => entry.unlockCitizens <= citizens && !active.includes(entry.id) && !done.includes(entry.id));
    let completed = current.completed;
    let candidates = open(completed);
    if (candidates.length === 0 && completed.length > 0) {
      completed = [];
      candidates = open(completed);
    }
    if (candidates.length === 0) return { ...current, completed };
    const { value, rngState } = nextRandom(current.rngState);
    const chosen = candidates[Math.floor(value * candidates.length)]!;
    current = { ...current, rngState, completed, objectives: [...current.objectives, { id: chosen.id, heldDays: 0 }] };
  }
  return current;
}

// Judges the active Objectives for one game day: the ones held long enough pay their Grant and give way to others.
export function judgeObjectives(state: GameState, politics: PoliticsState, isMet: (state: GameState, id: ObjectiveId) => boolean = isObjectiveMet): PoliticsState {
  let grantsDue = politics.grantsDue;
  const completed = [...politics.completed];
  const objectives: ActiveObjective[] = [];
  for (const { id, heldDays } of politics.objectives) {
    const held = isMet(state, id) ? heldDays + 1 : 0;
    if (held < objectiveById(id).holdDays) {
      objectives.push({ id, heldDays: held });
      continue;
    }
    grantsDue += grantOf(state, id);
    completed.push(id);
  }
  return refillObjectives(state, { ...politics, objectives, completed, grantsDue });
}
