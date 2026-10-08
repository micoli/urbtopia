import { createStore } from 'zustand/vanilla';
import type { ArcadeFixtureId } from '../core';

export interface VenueStore {
  venueId: number | null;
  selectedFixture: ArcadeFixtureId | null;
  open: (venueId: number) => void;
  close: () => void;
  selectFixture: (fixture: ArcadeFixtureId | null) => void;
}

export const venueStore = createStore<VenueStore>((set) => ({
  venueId: null,
  selectedFixture: null,
  open: (venueId) => set({ venueId, selectedFixture: null }),
  close: () => set({ venueId: null, selectedFixture: null }),
  selectFixture: (selectedFixture) => set({ selectedFixture }),
}));
