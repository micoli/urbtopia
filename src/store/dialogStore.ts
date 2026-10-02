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
  setSaveFailed: (open: boolean) => void;
  setPendingImport: (state: GameState | null) => void;
  setRecovery: (recovery: RecoveryInfo | null) => void;
  setExportReminder: (open: boolean) => void;
}

export const dialogStore = createStore<DialogStore>((set) => ({
  saveFailed: false,
  pendingImport: null,
  recovery: null,
  exportReminder: false,
  setSaveFailed: (saveFailed) => set({ saveFailed }),
  setPendingImport: (pendingImport) => set({ pendingImport }),
  setRecovery: (recovery) => set({ recovery }),
  setExportReminder: (exportReminder) => set({ exportReminder }),
}));
