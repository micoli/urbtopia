import { createStore } from 'zustand/vanilla';

export type Language = 'en' | 'fr';
export type Layout = 'C' | 'A' | 'B';

export interface Prefs {
  language: Language;
  layout: Layout;
}

export const PREFS_KEY = 'urbtopia-prefs';

const LANGUAGES: Language[] = ['en', 'fr'];
const LAYOUTS: Layout[] = ['C', 'A', 'B'];

export function defaultLanguage(browserLanguage: string | undefined): Language {
  return browserLanguage?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function parsePrefs(raw: string | null, browserLanguage?: string): Prefs {
  const fallback: Prefs = { language: defaultLanguage(browserLanguage), layout: 'C' };
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      language: LANGUAGES.includes(parsed.language as Language) ? (parsed.language as Language) : fallback.language,
      layout: LAYOUTS.includes(parsed.layout as Layout) ? (parsed.layout as Layout) : fallback.layout,
    };
  } catch {
    return fallback;
  }
}

function readStored(): string | null {
  try {
    return localStorage.getItem(PREFS_KEY);
  } catch {
    return null;
  }
}

function writeStored(prefs: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Preferences are a convenience: the game works without storing them.
  }
}

export interface PrefsStore extends Prefs {
  setLanguage: (language: Language) => void;
  setLayout: (layout: Layout) => void;
}

const browserLanguage = typeof navigator === 'undefined' ? undefined : navigator.language;

export const prefsStore = createStore<PrefsStore>((set, get) => ({
  ...parsePrefs(readStored(), browserLanguage),
  setLanguage: (language) => {
    set({ language });
    writeStored({ language, layout: get().layout });
  },
  setLayout: (layout) => {
    set({ layout });
    writeStored({ language: get().language, layout });
  },
}));
