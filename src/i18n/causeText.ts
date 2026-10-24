import type { Cause } from '../core';
import { t } from './t';
import type { MessageKey } from './messages';

export function causeText(cause: Cause): string {
  return Object.entries(cause.params).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), t(cause.key as MessageKey));
}
