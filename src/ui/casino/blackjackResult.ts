import type { BlackjackOutcome } from '../../core';
import type { MessageKey } from '../../i18n/messages';

export function blackjackResultKey(outcome: BlackjackOutcome): MessageKey {
  if (outcome === 'blackjack') return 'casino.naturalWin';
  if (outcome === 'push') return 'casino.push';
  return outcome === 'win' ? 'casino.won' : 'casino.lost';
}
