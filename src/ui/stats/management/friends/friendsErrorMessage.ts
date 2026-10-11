import type { MessageKey } from '../../../../i18n/messages';
import { t } from '../../../../i18n/t';
import type { SocialErrorKind } from '../../../../social/types';

const DAY_SECONDS = 86_400;

function errorKey(kind: SocialErrorKind): MessageKey {
  if (kind === 'handle-invalid' || kind === 'handle-forbidden' || kind === 'handle-taken' || kind === 'handle-change-too-soon' || kind === 'offline') {
    return `friends.error.${kind}`;
  }
  return 'friends.error.unknown';
}

export function daysFromSeconds(seconds: number | null): number {
  return Math.max(1, Math.ceil((seconds ?? 0) / DAY_SECONDS));
}

export function friendsErrorMessage(kind: SocialErrorKind, retryAfterSeconds: number | null): string {
  return t(errorKey(kind)).replace('{N}', String(daysFromSeconds(retryAfterSeconds)));
}
