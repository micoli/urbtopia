import { createStore } from 'zustand/vanilla';
import type { ReplanSummary } from '../core';

export interface ReplanSummaryStore {
  // What the player is told when a Replan ends; null when there is nothing to tell or it was read.
  summary: ReplanSummary | null;
  show: (summary: ReplanSummary) => void;
  dismiss: () => void;
}

export const replanSummaryStore = createStore<ReplanSummaryStore>((set) => ({
  summary: null,
  show: (summary) => set({ summary }),
  dismiss: () => set({ summary: null }),
}));
