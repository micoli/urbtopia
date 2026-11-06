import { bugReportInboxStore } from '../../bugReports/bugReportInboxStore';
import { bugReportStore } from '../../bugReports/bugReportStore';
import { cloudStore } from '../../store/cloudStore';
import { toastStore } from '../../store/toastStore';
import { uiStore } from '../../store/uiStore';

export function canReportBugs(): boolean {
  return cloudStore.getState().account?.email != null;
}

export function requestBugReport(): void {
  if (!cloudStore.getState().enabled) return;
  if (!canReportBugs()) {
    toastStore.getState().show('bugReport.error.account');
    return;
  }
  void bugReportStore.getState().openForm();
}

export function openBugReportInbox(): void {
  uiStore.setState({ settingsOpen: false });
  bugReportInboxStore.getState().openInbox();
}
