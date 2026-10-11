import { t } from '../../../i18n/t';
import type { MessageKey } from '../../../i18n/messages';
import type { TradeFailure } from '../../../social/tradeCoordinator';

const SOCIAL_KEYS: Partial<Record<string, MessageKey>> = {
  'trade-invalid': 'exchanges.error.trade-invalid',
  'trade-unavailable': 'exchanges.error.trade-unavailable',
  'cap-trades-open': 'exchanges.error.cap-trades-open',
  'rate-limited': 'exchanges.error.rate-limited',
  'not-friends': 'friends.error.not-friends',
  offline: 'friends.error.offline',
};

export function tradeFailureMessage(failure: TradeFailure): string {
  if (failure.kind === 'read-only') return t('exchanges.error.read-only');
  if (failure.kind === 'game') return t(failure.key);
  const minutes = Math.max(1, Math.ceil((failure.retryAfterSeconds ?? 60) / 60));
  return t(SOCIAL_KEYS[failure.error] ?? 'friends.error.unknown').replace('{N}', String(minutes));
}
