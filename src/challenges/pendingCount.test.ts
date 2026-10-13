import { beforeEach, describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { challengeStore } from '../store/challengeStore';
import { pendingChallengesCount } from './pendingCount';
import { readSeenChallenges } from './seenChallenges';
import type { Challenge, ChallengeSnapshot } from './types';

const T0 = 1_700_000_000_000;
const state = newGame({ seed: 'amber-fox-4821', now: T0 });

function challenge(id: string, difficulty: 'easy' | 'medium' | 'hard', minCitizens = 0): Challenge {
  return { id, kind: 'daily', difficulty, minCitizens, goal: [{ item: 'wood', quantity: 5 }], rewardKind: 'urbs', medalCode: null, nameKeys: { hook: 0, item: 'wood' }, nameFr: null, nameEn: null, startsAt: T0 - 1, endsAt: T0 + 1000 };
}

function snapshot(challenges: Challenge[], acceptedId: string | null = null): ChallengeSnapshot {
  return { serverNow: T0, challenges, accepted: acceptedId ? { challengeId: acceptedId, acceptedAt: T0, deadline: T0 + 1000 } : null, medals: [] };
}

describe('pendingChallengesCount', () => {
  const all = [challenge('e', 'easy'), challenge('m', 'medium'), challenge('h', 'hard'), challenge('h-late', 'hard', 600)];

  it('counts the Challenges of the city not seen yet', () => {
    expect(pendingChallengesCount(state, snapshot(all), [])).toBe(3);
    expect(pendingChallengesCount(state, snapshot(all), ['e'])).toBe(2);
  });

  it('is zero before the first snapshot and once everything is seen', () => {
    expect(pendingChallengesCount(state, null, [])).toBe(0);
    expect(pendingChallengesCount(state, snapshot(all), ['e', 'm', 'h'])).toBe(0);
  });

  it('does not count the accepted Challenge', () => {
    expect(pendingChallengesCount(state, snapshot(all, 'e'), [])).toBe(2);
  });
});

describe('challenge store seen list', () => {
  beforeEach(() => challengeStore.setState({ seen: [] }));

  it('remembers the Challenges seen, once each', () => {
    challengeStore.getState().markSeen(['a', 'b']);
    challengeStore.getState().markSeen(['b', 'c']);
    expect(challengeStore.getState().seen).toEqual(['a', 'b', 'c']);
  });

  it('reads nothing back where storage is unavailable', () => {
    expect(readSeenChallenges()).toEqual([]);
  });
});
