import { totalCitizens } from '../buildings/city';
import { difficultyOf } from '../engine/difficulty';
import { hashSeed } from '../engine/random';
import type { GameState } from '../engine/state';
import { ECOLOGY } from '../environment/ecology';
import { cityBenefits } from '../environment/wellbeing';
import { type FactionId } from './factions';
import { ordinanceById, type OrdinanceId } from './ordinances';
import type { ObjectiveId } from './objectives';
import { judgeObjectives, refillObjectives, type ActiveObjective } from './objectiveTracking';
import { withJournal, type JournalEntry } from './journal';
import { holdElection, type ElectionResult } from './election';
import { advancePetitions, type Petition, type Support } from './petitions';
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
  objectives: ActiveObjective[];
  // The Objectives done in the current cycle.
  completed: ObjectiveId[];
  // Urbs of Grants earned and not yet claimed.
  grantsDue: number;
  petitions: Petition[];
  supports: Support[];
  nextPetitionId: number;
  // The first game day on which an ignored Petition may escalate and the Approval may be penalised.
  adaptationUntilDay: number;
  // The current Term: the game day it started and its rank, from 1.
  term: { startDay: number; number: number };
  // How favourable the Council is after the last Election, between -1 and 1; 0 before the first.
  mandate: number;
  lastElection?: ElectionResult;
  journal: JournalEntry[];
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
  const started: PoliticsState = { rngState: hashSeed(`${state.seed}:${POLITICS_STREAM}`), approval: POLITICS.approval.initial, shock: 0, day: politicsDayOf(state), seats: { ...POLITICS.council.seats }, adopted: [], retryDay: {}, objectives: [], completed: [], grantsDue: 0, petitions: [], supports: [], nextPetitionId: 1, adaptationUntilDay: politicsDayOf(state) + POLITICS.adaptationDays, term: { startDay: politicsDayOf(state), number: 1 }, mandate: 0, journal: [] };
  return { ...state, politics: refillObjectives(state, started) };
}

const clamp = (value: number): number => Math.max(0, Math.min(MAX_APPROVAL, value));

// The standing of the Mayor, between 0 and 100; null while there is no politics.
export function approvalOf(state: GameState): number | null {
  if (!state.politics || !isPoliticsActive(state)) return null;
  return clamp(state.politics.approval + state.politics.shock);
}

// During the Adaptation period the Approval suffers no penalty.
export const isPoliticsAdaptingOn = (politics: PoliticsState, day: number): boolean => day < politics.adaptationUntilDay;

export function withApprovalShock(state: GameState, points: number): GameState {
  if (!state.politics) return state;
  if (points < 0 && isPoliticsAdaptingOn(state.politics, state.politics.day)) return state;
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

function electionIfDue(state: GameState, politics: PoliticsState): PoliticsState {
  if (!politicsRuleOf(difficultyOf(state)).election) return politics;
  if (politics.day - politics.term.startDay < POLITICS.term.days) return politics;
  return holdElection(politics, clamp(politics.approval + politics.shock), politics.day);
}

function advanceDay(state: GameState): GameState {
  const { dailyConvergence, shockFadePerDay } = POLITICS.approval;
  const politics = state.politics!;
  const target = totalCitizens(state) > 0 ? clamp(cityBenefits(state).wellbeing) : politics.approval;
  const { urbs, adopted } = payUpkeep(state, politics.adopted);
  const judged = judgeObjectives(state, politics);
  const petitioned = advancePetitions(state, judged);
  const converged = clamp(politics.approval + (target - politics.approval) * dailyConvergence);
  const next: PoliticsState = {
    ...petitioned.politics,
    approval: isPoliticsAdaptingOn(politics, politics.day + 1) ? Math.max(politics.approval, converged) : converged,
    shock: politics.shock * (1 - shockFadePerDay) + petitioned.shock,
    day: politics.day + 1,
    adopted,
  };
  return { ...state, urbs, politics: withJournal(politics, electionIfDue(state, next)) };
}

// The days of an absence beyond the offline cap are not played: the politics moves on with its clock, as if they never happened.
export function forfeitPoliticsDays(state: GameState): GameState {
  const politics = state.politics;
  if (!politics) return state;
  const days = politicsDayOf(state) - politics.day;
  if (days <= 0) return state;
  const retryDay = Object.fromEntries(Object.entries(politics.retryDay).map(([id, day]) => [id, day + days]));
  return {
    ...state,
    politics: {
      ...politics,
      day: politics.day + days,
      retryDay,
      adaptationUntilDay: politics.adaptationUntilDay + days,
      term: { ...politics.term, startDay: politics.term.startDay + days },
      petitions: politics.petitions.map(petition => ({ ...petition, since: petition.since + days })),
      supports: politics.supports.map(support => ({ ...support, since: support.since + days })),
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
