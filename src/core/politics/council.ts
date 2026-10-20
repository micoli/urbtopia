import { totalCitizens } from '../buildings/city';
import type { GameState } from '../engine/state';
import { FACTION_IDS, type FactionId } from './factions';
import { approvalOf, isPoliticsActive, politicsDayOf } from './politics';
import { ordinanceById, type OrdinanceId } from './ordinances';
import { politicsRuleOf } from './politicsBalance';
import { difficultyOf } from '../engine/difficulty';

export type Vote = 'for' | 'against';

export interface FactionVote {
  faction: FactionId;
  seats: number;
  vote: Vote;
}

export interface CouncilForecast {
  votes: readonly FactionVote[];
  seatsFor: number;
  seats: number;
  passes: boolean;
}

export type ProposalIssue = 'inactive' | 'locked' | 'adopted' | 'excluded' | 'waiting';

const NEUTRAL_APPROVAL = 50;

// Between -1 and 1, and 0 unless the Difficulty makes the Approval weigh on the Council.
export function councilGoodwill(state: GameState): number {
  if (!politicsRuleOf(difficultyOf(state)).approvalWeighsOnCouncil) return 0;
  const approval = approvalOf(state);
  return approval === null ? 0 : (approval - NEUTRAL_APPROVAL) / NEUTRAL_APPROVAL;
}

export function adoptedOrdinances(state: GameState): readonly OrdinanceId[] {
  return state.politics?.adopted ?? [];
}

// A Faction votes for an Ordinance when its stance, lifted or lowered by the Council's goodwill, is above neutral.
export function councilForecast(state: GameState, id: OrdinanceId): CouncilForecast {
  const { stances } = ordinanceById(id);
  const goodwill = councilGoodwill(state);
  const seatsOf = state.politics?.seats;
  const votes = FACTION_IDS.map((faction): FactionVote => ({ faction, seats: seatsOf?.[faction] ?? 0, vote: stances[faction] + goodwill > 0 ? 'for' : 'against' }));
  const seats = votes.reduce((sum, { seats: own }) => sum + own, 0);
  const seatsFor = votes.reduce((sum, { seats: own, vote }) => sum + (vote === 'for' ? own : 0), 0);
  return { votes, seatsFor, seats, passes: seatsFor * 2 > seats };
}

export function proposalIssue(state: GameState, id: OrdinanceId): ProposalIssue | null {
  if (!isPoliticsActive(state) || !state.politics) return 'inactive';
  const ordinance = ordinanceById(id);
  if (totalCitizens(state) < ordinance.unlockCitizens) return 'locked';
  const adopted = state.politics.adopted;
  if (adopted.includes(id)) return 'adopted';
  if (ordinance.exclusiveGroup && adopted.some(other => ordinanceById(other).exclusiveGroup === ordinance.exclusiveGroup)) return 'excluded';
  if (politicsDayOf(state) < (state.politics.retryDay[id] ?? 0)) return 'waiting';
  return null;
}
