import { BugReportInboxDialog } from './BugReportInboxDialog';
import { useBugReportInbox } from './useBugReportInbox';

export function BugReportInboxWindow() {
  const open = useBugReportInbox((store) => store.open);
  if (!open) return null;
  return <BugReportInboxDialog />;
}
