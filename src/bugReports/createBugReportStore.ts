import { createStore } from 'zustand/vanilla';
import type { ReportSnapshot } from './liveReportSnapshot';

export interface BugReportStore {
  open: boolean;
  opening: boolean;
  snapshot: ReportSnapshot | null;
  openForm: () => Promise<void>;
  closeForm: () => void;
}

export interface BugReportDeps {
  closeWindows: () => void;
  nextFrame: () => Promise<void>;
  capture: () => Promise<ReportSnapshot>;
}

// The windows around the map are closed and the page redrawn before the capture, or they would hide what the player saw.
export function createBugReportStore(deps: BugReportDeps) {
  return createStore<BugReportStore>((set, get) => ({
    open: false,
    opening: false,
    snapshot: null,
    openForm: async () => {
      if (get().open || get().opening) return;
      set({ opening: true });
      deps.closeWindows();
      await deps.nextFrame();
      await deps.nextFrame();
      try {
        const snapshot = await deps.capture();
        set({ open: true, snapshot, opening: false });
      } catch {
        set({ opening: false });
      }
    },
    closeForm: () => set({ open: false, snapshot: null }),
  }));
}
