import type { MessageKey } from '../../i18n/messages';
import { BugReportError } from '../../bugReports/types';

export function bugReportErrorKey(error: unknown): MessageKey {
  if (!(error instanceof BugReportError)) return 'bugReport.error.unknown';
  if (error.kind === 'offline') return 'bugReport.error.offline';
  if (error.kind === 'rate-limited') return 'bugReport.error.rateLimited';
  if (error.kind === 'invalid') return 'bugReport.error.invalid';
  if (error.kind === 'email-required' || error.kind === 'unauthenticated') return 'bugReport.error.account';
  return 'bugReport.error.unknown';
}
