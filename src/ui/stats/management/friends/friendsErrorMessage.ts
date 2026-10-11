import type { MessageKey } from '../../../../i18n/messages';
import { t } from '../../../../i18n/t';
import type { SocialErrorKind } from '../../../../social/types';

const DAY_SECONDS = 86_400;
const MINUTE_SECONDS = 60;

type FriendsErrorKind = 'handle-invalid' | 'handle-forbidden' | 'handle-taken' | 'handle-change-too-soon' | 'rate-limited' | 'cap-friends' | 'cap-outgoing' | 'not-found' | 'message-invalid' | 'not-friends' | 'offline';

const KNOWN: ReadonlySet<SocialErrorKind> = new Set<FriendsErrorKind>([
  'handle-invalid', 'handle-forbidden', 'handle-taken', 'handle-change-too-soon', 'rate-limited', 'cap-friends', 'cap-outgoing', 'not-found', 'message-invalid', 'not-friends', 'offline',
]);

function errorKey(kind: SocialErrorKind): MessageKey {
  return KNOWN.has(kind) ? `friends.error.${kind as FriendsErrorKind}` : 'friends.error.unknown';
}

export function daysFromSeconds(seconds: number | null): number {
  return Math.max(1, Math.ceil((seconds ?? 0) / DAY_SECONDS));
}

export function minutesFromSeconds(seconds: number | null): number {
  return Math.max(1, Math.ceil((seconds ?? 0) / MINUTE_SECONDS));
}

export function friendsErrorMessage(kind: SocialErrorKind, retryAfterSeconds: number | null, scope: 'search' | 'message' = 'search'): string {
  if (kind === 'rate-limited' && scope === 'message') return t('friends.error.message-rate-limited').replace('{N}', String(Math.max(1, retryAfterSeconds ?? 1)));
  const delay = kind === 'rate-limited' ? minutesFromSeconds(retryAfterSeconds) : daysFromSeconds(retryAfterSeconds);
  return t(errorKey(kind)).replace('{N}', String(delay));
}
