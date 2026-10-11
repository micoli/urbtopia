import type { MessageKey } from '../../i18n/messages';
import type { EmailCodeState } from '../../store/cloudStore';

export function emailCodeMessageKey(state: EmailCodeState): MessageKey | null {
  if (state.kind === 'sent') {
    if (state.error === 'invalid-code') return 'cloud.account.invalidCode';
    if (state.error === 'rate-limited') return 'cloud.account.rateLimited';
    return state.error === 'failed' ? 'cloud.account.failed' : null;
  }
  if (state.kind !== 'error') return null;
  if (state.reason === 'invalid-email') return 'cloud.account.invalidEmail';
  return state.reason === 'rate-limited' ? 'cloud.account.rateLimited' : 'cloud.account.failed';
}
