import { useStore } from 'zustand';
import { bugReportStore } from '../../bugReports/bugReportStore';
import { BugReportDialog } from './BugReportDialog';

export function BugReportWindow() {
  const open = useStore(bugReportStore, (store) => store.open);
  const snapshot = useStore(bugReportStore, (store) => store.snapshot);
  if (!open || !snapshot) return null;
  return <BugReportDialog snapshot={snapshot} />;
}
