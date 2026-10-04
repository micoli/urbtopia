import { blackjackOutcome, type BlackjackRound } from '../../../../core';
import type { BlackjackWinner } from './BlackjackFelt.tsx';

export function winnerOf(hand: BlackjackRound | null): BlackjackWinner | null {
  if (!hand?.finished) return null;
  const outcome = blackjackOutcome(hand);
  if (outcome === 'push') return 'push';
  return outcome === 'lose' ? 'dealer' : 'player';
}
