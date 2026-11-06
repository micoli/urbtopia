import { getBugReportClient } from './bugReportClientHandle';
import { createBugReportInboxStore } from './createBugReportInboxStore';

export const bugReportInboxStore = createBugReportInboxStore(getBugReportClient);
