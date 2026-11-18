import { createStore } from 'zustand/vanilla';
import { createDoubleTapDetector } from './doubleTap';

interface SelectionExpansionStore {
  expandedKey: string | null;
  expand: (key: string) => void;
}

export const selectionExpansionStore = createStore<SelectionExpansionStore>((set) => ({
  expandedKey: null,
  expand: (expandedKey) => set({ expandedKey }),
}));

export const buildingSelectionKey = (id: number): string => `building:${id}`;
export const accessSelectionKey = (tile: { x: number; y: number }): string => `access:${tile.x},${tile.y}`;
export const fixtureSelectionKey = (venueId: number, fixtureId: number): string => `fixture:${venueId}:${fixtureId}`;

const isDoubleTap = createDoubleTapDetector();

// A double tap on a target opens its panel even when the auto-open preference is off; any other tap closes what a double tap opened.
export function registerSelectionTap(key: string | null): void {
  const { expandedKey, expand } = selectionExpansionStore.getState();
  if (key !== null && isDoubleTap(key)) return expand(key);
  if (expandedKey !== null) selectionExpansionStore.setState({ expandedKey: null });
}
