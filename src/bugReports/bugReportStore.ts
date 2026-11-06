import { uiStore } from '../store/uiStore';
import { createBugReportStore } from './createBugReportStore';
import { captureReportSnapshot } from './liveReportSnapshot';

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export const bugReportStore = createBugReportStore({
  closeWindows: () => uiStore.setState({ statsOpen: false, politicsOpen: false, socialOpen: false, marketOpen: false, settingsOpen: false }),
  nextFrame,
  capture: () => captureReportSnapshot(),
});
