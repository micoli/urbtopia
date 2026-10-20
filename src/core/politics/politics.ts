import { totalCitizens } from '../buildings/city';
import { difficultyOf } from '../engine/difficulty';
import { hashSeed } from '../engine/random';
import type { GameState } from '../engine/state';
import { ECOLOGY } from '../environment/ecology';
import { cityBenefits } from '../environment/wellbeing';
import { type FactionId } from './factions';
import { ordinanceById, type OrdinanceId } from './ordinances';
import { POLITICS, politicsRuleOf } from './politicsBalance';

export interface PoliticsState {
  rngState: number;
  // The Approval before the shocks: it moves toward the mean Well-being each day.
  approval: number;
  // The sum of the one-off shocks still felt; it fades each day.
  shock: number;
  // The game day the politics was last advanced to.
  day: number;
  seats: Record<FactionId, number>;
  // The adopted Ordinances, in the order they were adopted.
  adopted: OrdinanceId[];
  // The game day from which a rejected Ordinance can be proposed again.
  retryDay: Partial<Record<OrdinanceId, number>>;
}

const POLITICS_STREAM = 'politics';

const MAX_APPROVAL = 100;

export function isPoliticsActive(state: GameState): boolean {
  if (!politicsRuleOf(difficultyOf(state)).active) return false;
  return state.buildings.some(building => building.type === 'townHall');
}

export function politicsDayOf(state: GameState): number {
  return Math.floor((state.lastSeen + (state.timeOffset ?? 0)) / (POLITICS.dayHours * ECOLOGY.hourMs));
}

export function withPolitics(state: GameState): GameState {
  if (state.politics || !isPoliticsActive(state)) return state;
  return { ...state, politics: { rngState: hashSeed(`${state.seed}:${POLITICS_STREAM}`), approval: POLITICS.approval.initial, shock: 0, day: politicsDayOf(state), seats: { ...POLITICS.council.seats }, adopted: [], retryDay: {} } };
}

const clamp = (value: number): number => Math.max(0, Math.min(MAX_APPROVAL, value));

// The standing of the Mayor, between 0 and 100; null while there is no politics.
export function approvalOf(state: GameState): number | null {
  if (!state.politics || !isPoliticsActive(state)) return null;
  return clamp(state.politics.approval + state.politics.shock);
}

export function withApprovalShock(state: GameState, points: number): GameState {
  if (!state.politics) return state;
  return { ...state, politics: { ...state.politics, shock: state.politics.shock + points } };
}

// The upkeep of the adopted Ordinances is paid in Urbs each day; one that cannot be paid lapses.
function payUpkeep(state: GameState, adopted: readonly OrdinanceId[]): { urbs: number; adopted: OrdinanceId[] } {
  let urbs = state.urbs;
  const kept: OrdinanceId[] = [];
  for (const id of adopted) {
    const upkeep = ordinanceById(id).upkeepPerDay;
    if (urbs < upkeep) continue;
    urbs -= upkeep;
    kept.push(id);
  }
  return { urbs, adopted: kept };
}

function advanceDay(state: GameState): GameState {
  const { dailyConvergence, shockFadePerDay } = POLITICS.approval;
  const politics = state.politics!;
  const target = totalCitizens(state) > 0 ? cityBenefits(state).wellbeing : politics.approval;
  const { urbs, adopted } = payUpkeep(state, politics.adopted);
  return {
    ...state,
    urbs,
    politics: {
      ...politics,
      approval: clamp(politics.approval + (target - politics.approval) * dailyConvergence),
      shock: politics.shock * (1 - shockFadePerDay),
      day: politics.day + 1,
      adopted,
    },
  };
}

// Plays every game day elapsed since the politics was last advanced.
export function advancePolitics(state: GameState): GameState {
  if (!state.politics || !isPoliticsActive(state)) return state;
  const today = politicsDayOf(state);
  let current = state;
  while (current.politics!.day < today) current = advanceDay(current);
  return current;
}
