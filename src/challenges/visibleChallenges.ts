import { isItemUnlocked, totalCitizens, type GameState, type ItemId } from '../core';
import type { Challenge, ChallengeDifficulty } from './types';

const DIFFICULTY_ORDER: readonly ChallengeDifficulty[] = ['easy', 'medium', 'hard'];

function isPlayable(state: GameState, challenge: Challenge): boolean {
  if (totalCitizens(state) < challenge.minCitizens) return false;
  return challenge.goal.every(({ item }) => isItemUnlocked(state, item as ItemId));
}

// For each difficulty, a city sees the highest Daily band it reaches; an Event is shown when the city reaches it.
export function visibleChallenges(state: GameState, challenges: Challenge[]): Challenge[] {
  const playable = challenges.filter((challenge) => isPlayable(state, challenge));
  const daily = DIFFICULTY_ORDER.flatMap((difficulty) => {
    const band = playable.filter((challenge) => challenge.kind === 'daily' && challenge.difficulty === difficulty);
    const best = band.reduce<Challenge | null>((top, challenge) => (top === null || challenge.minCitizens > top.minCitizens ? challenge : top), null);
    return best ? [best] : [];
  });
  const events = playable.filter((challenge) => challenge.kind === 'event').sort((a, b) => a.endsAt - b.endsAt);
  return [...daily, ...events];
}
