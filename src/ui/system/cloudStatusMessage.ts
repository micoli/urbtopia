import type { MessageKey } from '../../i18n/messages';
import type { CloudStatus } from '../../persistence/cloud/cloudSync';

export function cloudStatusMessageKey(status: CloudStatus): MessageKey {
  if (status.kind === 'error') return `cloud.error.${status.reason}`;
  return `cloud.status.${status.kind}`;
}

export function formatCloudTime(ms: number, language: string): string {
  return new Date(ms).toLocaleString(language, { dateStyle: 'short', timeStyle: 'short' });
}
