import { dealBlackjack, type BlackjackAction, type BlackjackRound } from '../../core';

export interface BlackjackSession {
  seed: number;
  hand: BlackjackRound;
  actions: BlackjackAction[];
}

export function sessionFor(session: BlackjackSession | null, roundSeed: number | null): BlackjackSession | null {
  if (roundSeed === null) return session;
  if (session?.seed === roundSeed) return session;
  return { seed: roundSeed, hand: dealBlackjack(roundSeed), actions: [] };
}
