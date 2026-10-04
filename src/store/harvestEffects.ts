import { createStore } from 'zustand/vanilla';
import type { HarvestedTile } from '../scene/renderItems';

export const AFTER_HARVEST_MS = 4000;

export interface HarvestEffects {
  tiles: HarvestedTile[];
  show: (tiles: readonly HarvestedTile[]) => void;
}

export const harvestEffects = createStore<HarvestEffects>((set, get) => ({
  tiles: [],
  show: (tiles) => {
    set({ tiles: [...get().tiles, ...tiles] });
    setTimeout(() => set({ tiles: get().tiles.filter((tile) => !tiles.includes(tile)) }), AFTER_HARVEST_MS);
  },
}));
