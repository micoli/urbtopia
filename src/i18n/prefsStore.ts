import { createStore } from 'zustand/vanilla';
import { isFacilityType, type FacilityType } from '../core/services/facilities';

export type Language = 'en' | 'fr';
export type Layout = 'C' | 'A' | 'B';

export interface Prefs {
  language: Language;
  layout: Layout;
  traffic: boolean;
  confirmSale: boolean;
  showReach: boolean;
  showProductionPreview: boolean;
  showTaxBadges: boolean;
  debug: boolean;
  alwaysDay: boolean;
  signInPrompt: boolean;
  serviceCoverageType: FacilityType;
  matchSpeed: MatchSpeed;
}

export const PREFS_KEY = 'urbtopia-prefs';

const LANGUAGES: Language[] = ['en', 'fr'];
const LAYOUTS: Layout[] = ['C', 'A', 'B'];
export const MATCH_SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;
export type MatchSpeed = (typeof MATCH_SPEEDS)[number];

export function defaultLanguage(browserLanguage: string | undefined): Language {
  return browserLanguage?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function parsePrefs(raw: string | null, browserLanguage?: string): Prefs {
  const fallback: Prefs = { language: defaultLanguage(browserLanguage), layout: 'C', traffic: true, confirmSale: true, showReach: true, showProductionPreview: true, showTaxBadges: true, debug: false, alwaysDay: false, signInPrompt: true, serviceCoverageType: 'school', matchSpeed: 1 };
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      language: LANGUAGES.includes(parsed.language as Language) ? (parsed.language as Language) : fallback.language,
      layout: LAYOUTS.includes(parsed.layout as Layout) ? (parsed.layout as Layout) : fallback.layout,
      traffic: typeof parsed.traffic === 'boolean' ? parsed.traffic : fallback.traffic,
      confirmSale: typeof parsed.confirmSale === 'boolean' ? parsed.confirmSale : fallback.confirmSale,
      showReach: typeof parsed.showReach === 'boolean' ? parsed.showReach : fallback.showReach,
      showProductionPreview: typeof parsed.showProductionPreview === 'boolean' ? parsed.showProductionPreview : fallback.showProductionPreview,
      showTaxBadges: typeof parsed.showTaxBadges === 'boolean' ? parsed.showTaxBadges : fallback.showTaxBadges,
      debug: typeof parsed.debug === 'boolean' ? parsed.debug : fallback.debug,
      alwaysDay: typeof parsed.alwaysDay === 'boolean' ? parsed.alwaysDay : fallback.alwaysDay,
      signInPrompt: typeof parsed.signInPrompt === 'boolean' ? parsed.signInPrompt : fallback.signInPrompt,
      serviceCoverageType: typeof parsed.serviceCoverageType === 'string' && isFacilityType(parsed.serviceCoverageType) ? parsed.serviceCoverageType : fallback.serviceCoverageType,
      matchSpeed: MATCH_SPEEDS.includes(parsed.matchSpeed as MatchSpeed) ? (parsed.matchSpeed as MatchSpeed) : fallback.matchSpeed,
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

function writeStored({ language, layout, traffic, confirmSale, showReach, showProductionPreview, showTaxBadges, debug, alwaysDay, signInPrompt, serviceCoverageType, matchSpeed }: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ language, layout, traffic, confirmSale, showReach, showProductionPreview, showTaxBadges, debug, alwaysDay, signInPrompt, serviceCoverageType, matchSpeed }));
  } catch {
    // Preferences are a convenience: the game works without storing them.
  }
}

export interface PrefsStore extends Prefs {
  setLanguage: (language: Language) => void;
  setLayout: (layout: Layout) => void;
  setTraffic: (traffic: boolean) => void;
  setConfirmSale: (confirmSale: boolean) => void;
  setShowReach: (showReach: boolean) => void;
  setShowProductionPreview: (showProductionPreview: boolean) => void;
  setShowTaxBadges: (showTaxBadges: boolean) => void;
  setDebug: (debug: boolean) => void;
  setAlwaysDay: (alwaysDay: boolean) => void;
  setSignInPrompt: (signInPrompt: boolean) => void;
  setServiceCoverageType: (type: FacilityType) => void;
  setMatchSpeed: (matchSpeed: MatchSpeed) => void;
}

const browserLanguage = typeof navigator === 'undefined' ? undefined : navigator.language;

export const prefsStore = createStore<PrefsStore>((set, get) => ({
  ...parsePrefs(readStored(), browserLanguage),
  setLanguage: (language) => {
    set({ language });
    writeStored(get());
  },
  setLayout: (layout) => {
    set({ layout });
    writeStored(get());
  },
  setTraffic: (traffic) => {
    set({ traffic });
    writeStored(get());
  },
  setConfirmSale: (confirmSale) => {
    set({ confirmSale });
    writeStored(get());
  },
  setShowReach: (showReach) => {
    set({ showReach });
    writeStored(get());
  },
  setShowProductionPreview: (showProductionPreview) => {
    set({ showProductionPreview });
    writeStored(get());
  },
  setShowTaxBadges: (showTaxBadges) => {
    set({ showTaxBadges });
    writeStored(get());
  },
  setDebug: (debug) => {
    set({ debug });
    writeStored(get());
  },
  setAlwaysDay: (alwaysDay) => {
    set({ alwaysDay });
    writeStored(get());
  },
  setSignInPrompt: (signInPrompt) => {
    set({ signInPrompt });
    writeStored(get());
  },
  setServiceCoverageType: (serviceCoverageType) => {
    set({ serviceCoverageType });
    writeStored(get());
  },
  setMatchSpeed: (matchSpeed) => {
    set({ matchSpeed });
    writeStored(get());
  },
}));
