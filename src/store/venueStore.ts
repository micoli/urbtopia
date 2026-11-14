import { createStore } from 'zustand/vanilla';
import type { FixtureCategory, FixtureId } from '../core';

export type VenuePanelId = 'build' | 'staff' | 'menu' | 'events' | 'takings' | 'parquet' | 'management';

export interface VenueStore {
  venueId: number | null;
  // The panel opened from the main menu of the interior; none when the menu is closed.
  panel: VenuePanelId | null;
  selectedFixture: FixtureId | null;
  placedId: number | null;
  movingId: number | null;
  // The section of the build menu left open, kept when the menu closes and when another interior opens; undefined before the player has touched it, null when every section is closed.
  openSection: FixtureCategory | null | undefined;
  setOpenSection: (section: FixtureCategory | null) => void;
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
  openSection: undefined,
  setOpenSection: (openSection) => set({ openSection }),
  open: (venueId) => set({ venueId, ...idle }),
  // One panel at a time: opening one closes the other, and the panel of a selected Fixture.
  togglePanel: (panel) => set(store => (store.panel === panel ? { panel: null, selectedFixture: null } : { panel, selectedFixture: panel === 'build' ? store.selectedFixture : null, placedId: null, movingId: null })),
  closePanel: () => set({ panel: null, selectedFixture: null }),
  close: () => set({ venueId: null, ...idle }),
  selectFixture: (selectedFixture) => set({ selectedFixture, placedId: null, movingId: null }),
  chooseFixture: (selectedFixture) => set({ selectedFixture, panel: null, placedId: null, movingId: null }),
  selectPlaced: (placedId) => set({ placedId, selectedFixture: null, movingId: null, ...(placedId === null ? {} : { panel: null }) }),
  startMove: (movingId) => set({ movingId, selectedFixture: null }),
  stopMove: () => set({ movingId: null }),
}));
