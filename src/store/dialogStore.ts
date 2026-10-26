import { createStore } from 'zustand/vanilla';
import type { ParseFailure } from '../persistence/envelope';

export interface RecoveryInfo {
  reason: ParseFailure;
  raw: string;
}

export interface DialogStore {
  saveFailed: boolean;
  recovery: RecoveryInfo | null;
  exportReminder: boolean;
  updateReady: boolean;
  creditsOpen: boolean;
  signInPromptDismissed: boolean;
  setSaveFailed: (open: boolean) => void;
  setRecovery: (recovery: RecoveryInfo | null) => void;
  setExportReminder: (open: boolean) => void;
  setUpdateReady: (ready: boolean) => void;
  setCreditsOpen: (open: boolean) => void;
  dismissSignInPrompt: () => void;
}

export const dialogStore = createStore<DialogStore>((set) => ({
  saveFailed: false,
  recovery: null,
  exportReminder: false,
  updateReady: false,
  creditsOpen: false,
  signInPromptDismissed: false,
  setSaveFailed: (saveFailed) => set({ saveFailed }),
  setRecovery: (recovery) => set({ recovery }),
  setExportReminder: (exportReminder) => set({ exportReminder }),
  setUpdateReady: (updateReady) => set({ updateReady }),
  setCreditsOpen: (creditsOpen) => set({ creditsOpen }),
  dismissSignInPrompt: () => set({ signInPromptDismissed: true }),
}));
