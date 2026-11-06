import { bugReportInboxStore } from '../../bugReports/bugReportInboxStore';
import { cloudStore } from '../../store/cloudStore';
import { toastStore } from '../../store/toastStore';

export function canReportBugs(): boolean {
  return cloudStore.getState().account?.email != null;
}

// The stores of the game load on click: the settings window only needs the buttons.
export async function requestBugReport(): Promise<void> {
  if (!cloudStore.getState().enabled) return;
  if (!canReportBugs()) {
    toastStore.getState().show('bugReport.error.account');
    return;
  }
  const { bugReportStore } = await import('../../bugReports/bugReportStore');
  await bugReportStore.getState().openForm();
}

export async function openBugReportInbox(): Promise<void> {
  const { uiStore } = await import('../../store/uiStore');
  uiStore.setState({ settingsOpen: false });
  bugReportInboxStore.getState().openInbox();
}
