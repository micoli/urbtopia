import { FR } from './fr';
import { MESSAGES, type MessageKey } from './messages';
import { prefsStore } from './prefsStore';

export function t(key: MessageKey): string {
  return prefsStore.getState().language === 'fr' ? FR[key] : MESSAGES[key];
}
