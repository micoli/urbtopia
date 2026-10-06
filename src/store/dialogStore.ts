import { createStore } from 'zustand/vanilla';
import type { GameState } from '../core';
import type { ParseFailure } from '../persistence/envelope';

export interface RecoveryInfo {
  reason: ParseFailure;
  raw: string;
}

export interface DialogStore {
  saveFailed: boolean;
  pendingImport: GameState | null;
  recovery: RecoveryInfo | null;
  exportReminder: boolean;
  updateReady: boolean;
  creditsOpen: boolean;
  setSaveFailed: (open: boolean) => void;
  setPendingImport: (state: GameState | null) => void;
  setRecovery: (recovery: RecoveryInfo | null) => void;
  setExportReminder: (open: boolean) => void;
  setUpdateReady: (ready: boolean) => void;
  setCreditsOpen: (open: boolean) => void;
}

export const dialogStore = createStore<DialogStore>((set) => ({
  saveFailed: false,
  pendingImport: null,
  recovery: null,
  exportReminder: false,
  updateReady: false,
  creditsOpen: false,
  setSaveFailed: (saveFailed) => set({ saveFailed }),
  setPendingImport: (pendingImport) => set({ pendingImport }),
  setRecovery: (recovery) => set({ recovery }),
  setExportReminder: (exportReminder) => set({ exportReminder }),
  setUpdateReady: (updateReady) => set({ updateReady }),
  setCreditsOpen: (creditsOpen) => set({ creditsOpen }),
}));
