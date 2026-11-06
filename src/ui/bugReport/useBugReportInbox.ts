import { useStore } from 'zustand';
import { bugReportInboxStore } from '../../bugReports/bugReportInboxStore';
import type { BugReportInboxStore } from '../../bugReports/createBugReportInboxStore';

export function useBugReportInbox<T>(selector: (store: BugReportInboxStore) => T): T {
  return useStore(bugReportInboxStore, selector);
}
