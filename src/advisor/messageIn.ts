import { FR } from '../i18n/fr';
import { MESSAGES, type MessageKey } from '../i18n/messages';
import type { Language } from '../i18n/prefsStore';

export function messageIn(language: Language, key: MessageKey, params: Readonly<Record<string, number | string>> = {}): string {
  const template = language === 'fr' ? FR[key] : MESSAGES[key];
  return Object.entries(params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
}
