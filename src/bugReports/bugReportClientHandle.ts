import { loadBugReportClient } from './loadBugReportClient';
import type { BugReportClient } from './types';

let client: Promise<BugReportClient | null> | null = null;

export function getBugReportClient(): Promise<BugReportClient | null> {
  client ??= loadBugReportClient();
  return client;
}

export function setBugReportClientForTests(value: BugReportClient | null): void {
  client = Promise.resolve(value);
}
