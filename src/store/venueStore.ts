import { createStore } from 'zustand/vanilla';
import type { FixtureId } from '../core';

export interface VenueStore {
  venueId: number | null;
  selectedFixture: FixtureId | null;
  placedId: number | null;
  movingId: number | null;
  open: (venueId: number) => void;
  close: () => void;
  selectFixture: (fixture: FixtureId | null) => void;
  selectPlaced: (fixtureId: number | null) => void;
  startMove: (fixtureId: number) => void;
  stopMove: () => void;
}

const idle = { selectedFixture: null, placedId: null, movingId: null };

export const venueStore = createStore<VenueStore>((set) => ({
  venueId: null,
  ...idle,
  open: (venueId) => set({ venueId, ...idle }),
  close: () => set({ venueId: null, ...idle }),
  selectFixture: (selectedFixture) => set({ selectedFixture, placedId: null, movingId: null }),
  selectPlaced: (placedId) => set({ placedId, selectedFixture: null, movingId: null }),
  startMove: (movingId) => set({ movingId, selectedFixture: null }),
  stopMove: () => set({ movingId: null }),
}));
