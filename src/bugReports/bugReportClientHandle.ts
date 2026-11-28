import { loadBugReportClient } from './loadBugReportClient';
import type { BugReportClient } from './types';

let client: Promise<BugReportClient | null> | null = null;

export function getBugReportClient(): Promise<BugReportClient | null> {
  if (client) return client;
  const loading = loadBugReportClient();
  client = loading;
  // A failed load (a chunk gone after a deployment, a network drop) must not stay cached: the next call tries again.
  loading.catch(() => {
    if (client === loading) client = null;
  });
  return loading;
}

export function setBugReportClientForTests(value: BugReportClient | null): void {
  client = Promise.resolve(value);
}
