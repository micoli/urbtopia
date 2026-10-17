import { isItemUnlocked, totalCitizens, type GameState, type ItemId } from '../core';
import type { Challenge, ChallengeDifficulty } from './types';

const DIFFICULTY_ORDER: readonly ChallengeDifficulty[] = ['easy', 'medium', 'hard'];

export function isChallengePlayable(state: GameState, challenge: Challenge): boolean {
  if (totalCitizens(state) < challenge.minCitizens) return false;
  return challenge.goal.every(({ item }) => isItemUnlocked(state, item as ItemId));
}

// For each difficulty, prefer the highest playable band, then the next locked band when requested.
export function visibleChallenges(state: GameState, challenges: Challenge[], includeUnavailable = false): Challenge[] {
  const unclaimed = challenges.filter(({ id }) => !state.challengeClaims?.some((claim) => claim.id === id));
  const playable = unclaimed.filter((challenge) => isChallengePlayable(state, challenge));
  const daily = DIFFICULTY_ORDER.flatMap((difficulty) => {
    const band = playable.filter((challenge) => challenge.kind === 'daily' && challenge.difficulty === difficulty);
    const best = band.reduce<Challenge | null>((top, challenge) => (top === null || challenge.minCitizens > top.minCitizens ? challenge : top), null);
    if (best) return [best];
    if (!includeUnavailable) return [];
    const next = unclaimed.filter((challenge) => challenge.kind === 'daily' && challenge.difficulty === difficulty).sort((a, b) => a.minCitizens - b.minCitizens)[0];
    return next ? [next] : [];
  });
  const events = (includeUnavailable ? unclaimed : playable).filter((challenge) => challenge.kind === 'event').sort((a, b) => a.endsAt - b.endsAt);
  return [...daily, ...events];
}
