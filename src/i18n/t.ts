import { MESSAGES, type MessageKey } from './messages';

export function t(key: MessageKey): string {
  return MESSAGES[key];
}
