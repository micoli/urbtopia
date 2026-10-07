import type { MessageKey } from '../../i18n/messages';
import type { EmailLinkState } from '../../store/cloudStore';

export function emailLinkMessageKey(state: EmailLinkState): MessageKey | null {
  if (state.kind === 'sent') return 'cloud.account.sent';
  if (state.kind !== 'error') return null;
  if (state.reason === 'invalid-email') return 'cloud.account.invalidEmail';
  return state.reason === 'rate-limited' ? 'cloud.account.rateLimited' : 'cloud.account.failed';
}
