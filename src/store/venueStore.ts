import { createStore } from 'zustand/vanilla';
import type { FixtureId } from '../core';

export type VenuePanelId = 'build' | 'staff' | 'events' | 'takings';

export interface VenueStore {
  venueId: number | null;
  // The panel opened from the main menu of the interior; none when the menu is closed.
  panel: VenuePanelId | null;
  selectedFixture: FixtureId | null;
  placedId: number | null;
  movingId: number | null;
  open: (venueId: number) => void;
  togglePanel: (panel: VenuePanelId) => void;
  closePanel: () => void;
  close: () => void;
  selectFixture: (fixture: FixtureId | null) => void;
  // Picks an item from the build menu: the menu closes and the add mode starts.
  chooseFixture: (fixture: FixtureId) => void;
  selectPlaced: (fixtureId: number | null) => void;
  startMove: (fixtureId: number) => void;
  stopMove: () => void;
}

const idle = { panel: null, selectedFixture: null, placedId: null, movingId: null };

export const venueStore = createStore<VenueStore>((set) => ({
  venueId: null,
  ...idle,
  open: (venueId) => set({ venueId, ...idle }),
  togglePanel: (panel) => set(store => (store.panel === panel ? { panel: null, selectedFixture: null } : { panel, selectedFixture: panel === 'build' ? store.selectedFixture : null })),
  closePanel: () => set({ panel: null, selectedFixture: null }),
  close: () => set({ venueId: null, ...idle }),
  selectFixture: (selectedFixture) => set({ selectedFixture, placedId: null, movingId: null }),
  chooseFixture: (selectedFixture) => set({ selectedFixture, panel: null, placedId: null, movingId: null }),
  selectPlaced: (placedId) => set({ placedId, selectedFixture: null, movingId: null }),
  startMove: (movingId) => set({ movingId, selectedFixture: null }),
  stopMove: () => set({ movingId: null }),
}));
