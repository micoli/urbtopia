import { createStore } from 'zustand/vanilla';

export type HintId = 'build' | 'repaint' | 'production' | 'tourism';

export const HINTS_KEY = 'urbtopia-hints';

const HINT_IDS: readonly HintId[] = ['build', 'repaint', 'production', 'tourism'];

export function parseSeenHints(raw: string | null): HintId[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? HINT_IDS.filter(id => parsed.includes(id)) : [];
  } catch {
    return [];
  }
}

function readStored(): string | null {
  try {
    return localStorage.getItem(HINTS_KEY);
  } catch {
    return null;
  }
}

function writeStored(seen: readonly HintId[]): void {
  try {
    localStorage.setItem(HINTS_KEY, JSON.stringify(seen));
  } catch {
    // Hints are a convenience: they come back next time when the browser cannot keep them.
  }
}

export interface HintsStore {
  seen: readonly HintId[];
  dismiss: (id: HintId) => void;
}

export const hintsStore = createStore<HintsStore>((set, get) => ({
  seen: parseSeenHints(readStored()),
  dismiss: (id) => {
    if (get().seen.includes(id)) return;
    const seen = [...get().seen, id];
    set({ seen });
    writeStored(seen);
  },
}));
