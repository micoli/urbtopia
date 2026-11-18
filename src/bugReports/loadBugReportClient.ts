import { readCloudConfig } from '../persistence/cloud/cloudConfig';
import type { BugReportClient } from './types';
import { withSentryFeedback } from './withSentryFeedback';

export async function loadBugReportClient(env?: Record<string, unknown>): Promise<BugReportClient | null> {
  const config = readCloudConfig(env);
  if (!config) return null;
  const { createSupabaseBugReportClient } = await import('./supabaseBugReportClient');
  return withSentryFeedback(await createSupabaseBugReportClient(config));
}
