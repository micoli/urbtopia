import { createStore } from 'zustand/vanilla';
import type { BuildingType } from '../core';
import { demonstrationsOf } from '../core/demonstrations/catalog';
import { gameStore } from './gameStore';

interface DemonstrationStore {
  buildingType: BuildingType | null;
  open: (type: BuildingType) => boolean;
  close: () => void;
}
let resumeCity: ((now: number) => void) | undefined;
export const demonstrationStore = createStore<DemonstrationStore>(set => ({
  buildingType: null,
  open: type => {
    if (demonstrationsOf(type).length === 0 || gameStore.getState().state.challenge) return false;
    resumeCity ??= gameStore.getState().suspend(Date.now());
    set({ buildingType: type });
    return true;
  },
  close: () => {
    resumeCity?.(Date.now());
    resumeCity = undefined;
    set({ buildingType: null });
  },
}));
