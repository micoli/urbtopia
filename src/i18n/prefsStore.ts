import { createStore } from 'zustand/vanilla';
import { DEFAULT_CONTEXT_LEVEL, isContextLevel, type ContextLevel } from '../advisor/contextLevel';
import { isFacilityType, type FacilityType } from '../core/services/facilities';

export type Language = 'en' | 'fr';
export type Layout = 'C' | 'A' | 'B';
// How the pedestrians of the map are drawn: as stick figures, or as the avatars of the players.
export type PedestrianModel = 'stickman' | 'avatar';

export interface Prefs {
  language: Language;
  layout: Layout;
  traffic: boolean;
  pedestrianModel: PedestrianModel;
  confirmSale: boolean;
  showReach: boolean;
  showProductionPreview: boolean;
  showTaxBadges: boolean;
  managementTabs: boolean;
  debug: boolean;
  // With the debug mode: how many pixels a click or a touch is moved before it picks a tile, to adjust the selection of buildings.
  debugOffsetX: number;
  debugOffsetY: number;
  alwaysDay: boolean;
  signInPrompt: boolean;
  advisor: boolean;
  advisorSuggestionsOpen: boolean;
  advisorContextLevel: ContextLevel;
  serviceCoverageType: FacilityType;
  matchSpeed: MatchSpeed;
}

export const PREFS_KEY = 'urbtopia-prefs';

const LANGUAGES: Language[] = ['en', 'fr'];
const LAYOUTS: Layout[] = ['C', 'A', 'B'];
const PEDESTRIAN_MODELS: PedestrianModel[] = ['stickman', 'avatar'];
export const DEBUG_OFFSET_LIMIT = 60;
export const MATCH_SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const;
export type MatchSpeed = (typeof MATCH_SPEEDS)[number];

export function defaultLanguage(browserLanguage: string | undefined): Language {
  return browserLanguage?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export function parsePrefs(raw: string | null, browserLanguage?: string): Prefs {
  const fallback: Prefs = { language: defaultLanguage(browserLanguage), layout: 'C', traffic: true, pedestrianModel: 'stickman', confirmSale: true, showReach: true, showProductionPreview: true, showTaxBadges: true, managementTabs: true, debug: false, debugOffsetX: 0, debugOffsetY: 0, alwaysDay: false, signInPrompt: true, advisor: false, advisorSuggestionsOpen: true, advisorContextLevel: DEFAULT_CONTEXT_LEVEL, serviceCoverageType: 'school', matchSpeed: 1 };
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      language: LANGUAGES.includes(parsed.language as Language) ? (parsed.language as Language) : fallback.language,
      layout: LAYOUTS.includes(parsed.layout as Layout) ? (parsed.layout as Layout) : fallback.layout,
      traffic: typeof parsed.traffic === 'boolean' ? parsed.traffic : fallback.traffic,
      pedestrianModel: PEDESTRIAN_MODELS.includes(parsed.pedestrianModel as PedestrianModel) ? (parsed.pedestrianModel as PedestrianModel) : fallback.pedestrianModel,
      confirmSale: typeof parsed.confirmSale === 'boolean' ? parsed.confirmSale : fallback.confirmSale,
      showReach: typeof parsed.showReach === 'boolean' ? parsed.showReach : fallback.showReach,
      showProductionPreview: typeof parsed.showProductionPreview === 'boolean' ? parsed.showProductionPreview : fallback.showProductionPreview,
      showTaxBadges: typeof parsed.showTaxBadges === 'boolean' ? parsed.showTaxBadges : fallback.showTaxBadges,
      managementTabs: typeof parsed.managementTabs === 'boolean' ? parsed.managementTabs : fallback.managementTabs,
      debug: typeof parsed.debug === 'boolean' ? parsed.debug : fallback.debug,
      debugOffsetX: offsetOf(parsed.debugOffsetX),
      debugOffsetY: offsetOf(parsed.debugOffsetY),
      alwaysDay: typeof parsed.alwaysDay === 'boolean' ? parsed.alwaysDay : fallback.alwaysDay,
      signInPrompt: typeof parsed.signInPrompt === 'boolean' ? parsed.signInPrompt : fallback.signInPrompt,
      advisor: typeof parsed.advisor === 'boolean' ? parsed.advisor : fallback.advisor,
      advisorSuggestionsOpen: typeof parsed.advisorSuggestionsOpen === 'boolean' ? parsed.advisorSuggestionsOpen : fallback.advisorSuggestionsOpen,
      advisorContextLevel: isContextLevel(parsed.advisorContextLevel) ? parsed.advisorContextLevel : fallback.advisorContextLevel,
      serviceCoverageType: typeof parsed.serviceCoverageType === 'string' && isFacilityType(parsed.serviceCoverageType) ? parsed.serviceCoverageType : fallback.serviceCoverageType,
      matchSpeed: MATCH_SPEEDS.includes(parsed.matchSpeed as MatchSpeed) ? (parsed.matchSpeed as MatchSpeed) : fallback.matchSpeed,
    };
  } catch {
    return fallback;
  }
}

function offsetOf(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) ? Math.max(-DEBUG_OFFSET_LIMIT, Math.min(DEBUG_OFFSET_LIMIT, value)) : 0;
}

function readStored(): string | null {
  try {
    return localStorage.getItem(PREFS_KEY);
  } catch {
    return null;
  }
}

function writeStored({ language, layout, traffic, pedestrianModel, confirmSale, showReach, showProductionPreview, showTaxBadges, managementTabs, debug, debugOffsetX, debugOffsetY, alwaysDay, signInPrompt, advisor, advisorSuggestionsOpen, advisorContextLevel, serviceCoverageType, matchSpeed }: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ language, layout, traffic, pedestrianModel, confirmSale, showReach, showProductionPreview, showTaxBadges, managementTabs, debug, debugOffsetX, debugOffsetY, alwaysDay, signInPrompt, advisor, advisorSuggestionsOpen, advisorContextLevel, serviceCoverageType, matchSpeed }));
  } catch {
    // Preferences are a convenience: the game works without storing them.
  }
}

export interface PrefsStore extends Prefs {
  setLanguage: (language: Language) => void;
  setLayout: (layout: Layout) => void;
  setTraffic: (traffic: boolean) => void;
  setPedestrianModel: (model: PedestrianModel) => void;
  setConfirmSale: (confirmSale: boolean) => void;
  setShowReach: (showReach: boolean) => void;
  setShowProductionPreview: (showProductionPreview: boolean) => void;
  setShowTaxBadges: (showTaxBadges: boolean) => void;
  setManagementTabs: (managementTabs: boolean) => void;
  setDebug: (debug: boolean) => void;
  setDebugOffset: (axis: 'x' | 'y', pixels: number) => void;
  setAlwaysDay: (alwaysDay: boolean) => void;
  setSignInPrompt: (signInPrompt: boolean) => void;
  setAdvisor: (advisor: boolean) => void;
  setAdvisorSuggestionsOpen: (open: boolean) => void;
  setAdvisorContextLevel: (level: ContextLevel) => void;
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
  setPedestrianModel: (pedestrianModel) => {
    set({ pedestrianModel });
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
  setManagementTabs: (managementTabs) => {
    set({ managementTabs });
    writeStored(get());
  },
  setDebug: (debug) => {
    set({ debug });
    writeStored(get());
  },
  setDebugOffset: (axis, pixels) => {
    set(axis === 'x' ? { debugOffsetX: offsetOf(pixels) } : { debugOffsetY: offsetOf(pixels) });
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
  setAdvisor: (advisor) => {
    set({ advisor });
    writeStored(get());
  },
  setAdvisorSuggestionsOpen: (advisorSuggestionsOpen) => {
    set({ advisorSuggestionsOpen });
    writeStored(get());
  },
  setAdvisorContextLevel: (advisorContextLevel) => {
    set({ advisorContextLevel });
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
