import type { GameState } from '../core';
import type { ChallengeSnapshot } from './types';
import { visibleChallenges } from './visibleChallenges';

// What the Events tab asks the player to look at: the Challenges their city can play and they have not opened the tab on yet.
export function pendingChallengesCount(state: GameState, snapshot: ChallengeSnapshot | null, seen: readonly string[]): number {
  if (!snapshot) return 0;
  return visibleChallenges(state, snapshot.challenges).filter(({ id }) => id !== snapshot.accepted?.challengeId && !seen.includes(id)).length;
}
