import type { AdvisorErrorKind } from '../../advisor/AdvisorEngine';
import type { MessageKey } from '../../i18n/messages';

const KEYS: Record<AdvisorErrorKind, MessageKey> = {
  unsupported: 'advisor.error.unsupported',
  'out-of-memory': 'advisor.error.outOfMemory',
  network: 'advisor.error.network',
  unknown: 'advisor.error.unknown',
};

export function advisorErrorKey(kind: AdvisorErrorKind): MessageKey {
  return KEYS[kind];
}
