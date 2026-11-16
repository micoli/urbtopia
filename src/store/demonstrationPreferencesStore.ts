import { createStore } from 'zustand/vanilla';
import type { BuildingType } from '../core';

export const DEMONSTRATION_PREFERENCES_KEY = 'urbtopia-demonstration-preferences';

interface DemonstrationPreferences {
  seenTypes: string[];
  hiddenTypes: string[];
}

function readPreferences(): DemonstrationPreferences {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DEMONSTRATION_PREFERENCES_KEY) ?? 'null');
    if (parsed && typeof parsed === 'object') {
      const value = parsed as Partial<DemonstrationPreferences>;
      return {
        seenTypes: Array.isArray(value.seenTypes) ? value.seenTypes.filter((type): type is string => typeof type === 'string') : [],
        hiddenTypes: Array.isArray(value.hiddenTypes) ? value.hiddenTypes.filter((type): type is string => typeof type === 'string') : [],
      };
    }
  } catch { /* Storage may be unavailable. */ }
  return { seenTypes: [], hiddenTypes: [] };
}

interface DemonstrationPreferencesStore extends DemonstrationPreferences {
  markSeen: (type: BuildingType) => void;
  hideInvitation: (type: BuildingType) => void;
}

export const demonstrationPreferencesStore = createStore<DemonstrationPreferencesStore>(set => ({
  ...readPreferences(),
  markSeen: type => set(state => state.seenTypes.includes(type) ? state : { seenTypes: [...state.seenTypes, type] }),
  hideInvitation: type => set(state => state.hiddenTypes.includes(type) ? state : { hiddenTypes: [...state.hiddenTypes, type] }),
}));

demonstrationPreferencesStore.subscribe(({ seenTypes, hiddenTypes }) => {
  try {
    localStorage.setItem(DEMONSTRATION_PREFERENCES_KEY, JSON.stringify({ seenTypes, hiddenTypes }));
  } catch { /* Keep the preference for this session when storage is unavailable. */ }
});
