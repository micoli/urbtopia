import { createStore } from 'zustand/vanilla';
import type { BuildingType } from '../core';
import { demonstrationsOf } from '../core/demonstrations/catalog';
import { gameStore } from './gameStore';

interface DemonstrationStore {
  buildingType: BuildingType | null;
  // The player watched a demonstration to its last step; the city is told once it runs again.
  finished: boolean;
  markFinished: () => void;
  open: (type: BuildingType) => boolean;
  close: () => void;
}
let resumeCity: ((now: number) => void) | undefined;
export const demonstrationStore = createStore<DemonstrationStore>((set, get) => ({
  buildingType: null,
  finished: false,
  markFinished: () => set({ finished: true }),
  open: type => {
    if (demonstrationsOf(type).length === 0 || gameStore.getState().state.challenge) return false;
    resumeCity ??= gameStore.getState().suspend(Date.now());
    set({ buildingType: type });
    return true;
  },
  close: () => {
    resumeCity?.(Date.now());
    resumeCity = undefined;
    if (get().finished) gameStore.getState().send({ type: 'Signal', signal: 'demonstrationFinished' });
    set({ buildingType: null, finished: false });
  },
}));
