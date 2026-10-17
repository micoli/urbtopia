import { createStore } from 'zustand/vanilla';
import type { MedalInfo } from '../challenges/types';

export interface SolidarityStore {
  value: number;
  pendingValue: number;
  medal: MedalInfo | null;
  failed: boolean;
}

export const solidarityStore = createStore<SolidarityStore>(() => ({ value: 0, pendingValue: 0, medal: null, failed: false }));
