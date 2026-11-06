import { describe, expect, it, vi } from 'vitest';
import { FR } from './fr';
import { MESSAGES } from './messages';
import { DEBUG_OFFSET_LIMIT, defaultLanguage, parsePrefs, PREFS_KEY, prefsStore } from './prefsStore';

describe('catalogs', () => {
  it('translate every message key in French, and nothing more', () => {
    expect(Object.keys(FR).sort()).toEqual(Object.keys(MESSAGES).sort());
  });

  it('never leave a message empty', () => {
    for (const catalog of [FR, MESSAGES] as Record<string, string>[]) {
      for (const [key, text] of Object.entries(catalog)) expect(text.trim(), key).not.toBe('');
    }
  });

  it('keep the game name and the currency identical in both languages', () => {
    expect(FR['stat.urbs']).toBe(MESSAGES['stat.urbs']);
    expect(FR['import.wrong-format']).toContain('Urbtopia');
    expect(MESSAGES['import.wrong-format']).toContain('Urbtopia');
  });

  it('translate plain statements instead of copying the English text', () => {
    expect(FR['panel.close']).not.toBe(MESSAGES['panel.close']);
    expect(FR['error.notEnoughUrbs']).toContain('Pas assez');
    expect(FR['error.notEnoughUrbs']).toContain('{U}');
    expect(MESSAGES['error.notEnoughUrbs']).toContain('{U}');
  });
});

describe('preferences', () => {
  it('picks French for French browsers and English otherwise', () => {
    expect(defaultLanguage('fr-FR')).toBe('fr');
    expect(defaultLanguage('fr')).toBe('fr');
    expect(defaultLanguage('en-US')).toBe('en');
    expect(defaultLanguage(undefined)).toBe('en');
  });

  it('keeps Always day off unless the stored value is a boolean', () => {
    expect(parsePrefs(JSON.stringify({ alwaysDay: true })).alwaysDay).toBe(true);
    expect(parsePrefs(JSON.stringify({ alwaysDay: 'yes' })).alwaysDay).toBe(false);
    expect(parsePrefs(null).alwaysDay).toBe(false);
    expect(parsePrefs(JSON.stringify({ fineRotation: true })).fineRotation).toBe(true);
    expect(parsePrefs(JSON.stringify({ fineRotation: 1 })).fineRotation).toBe(false);
  });

  it('reads stored preferences and falls back on bad values', () => {
    expect(parsePrefs(JSON.stringify({ language: 'fr', layout: 'B', traffic: false, confirmSale: false, showReach: false, showProductionPreview: false }))).toEqual({ language: 'fr', layout: 'B', traffic: false, pedestrians: true, pedestrianModel: 'stickman', trafficDensity: 'normal', pedestrianDensity: 'normal', confirmSale: false, showReach: false, showProductionPreview: false, showRecipeStock: false, showAutoProductionBadge: false, showTaxBadges: true, taxBadgeThreshold: 20, managementTabs: true, debug: false, debugOffsetX: 0, debugOffsetY: 0, alwaysDay: false, fineRotation: false, signInPrompt: true, advisor: false, advisorSuggestionsOpen: true, advisorContextLevel: 3, serviceCoverageType: 'school', matchSpeed: 1 });
    expect(parsePrefs(JSON.stringify({ language: 'de', layout: 'Z', traffic: 'yes' }), 'fr-FR')).toEqual({ language: 'fr', layout: 'C', traffic: true, pedestrians: true, pedestrianModel: 'stickman', trafficDensity: 'normal', pedestrianDensity: 'normal', confirmSale: true, showReach: true, showProductionPreview: true, showRecipeStock: false, showAutoProductionBadge: false, showTaxBadges: true, taxBadgeThreshold: 20, managementTabs: true, debug: false, debugOffsetX: 0, debugOffsetY: 0, alwaysDay: false, fineRotation: false, signInPrompt: true, advisor: false, advisorSuggestionsOpen: true, advisorContextLevel: 3, serviceCoverageType: 'school', matchSpeed: 1 });
    expect(parsePrefs('not json', 'en-GB')).toEqual({ language: 'en', layout: 'C', traffic: true, pedestrians: true, pedestrianModel: 'stickman', trafficDensity: 'normal', pedestrianDensity: 'normal', confirmSale: true, showReach: true, showProductionPreview: true, showRecipeStock: false, showAutoProductionBadge: false, showTaxBadges: true, taxBadgeThreshold: 20, managementTabs: true, debug: false, debugOffsetX: 0, debugOffsetY: 0, alwaysDay: false, fineRotation: false, signInPrompt: true, advisor: false, advisorSuggestionsOpen: true, advisorContextLevel: 3, serviceCoverageType: 'school', matchSpeed: 1 });
    expect(parsePrefs(null)).toEqual({ language: 'en', layout: 'C', traffic: true, pedestrians: true, pedestrianModel: 'stickman', trafficDensity: 'normal', pedestrianDensity: 'normal', confirmSale: true, showReach: true, showProductionPreview: true, showRecipeStock: false, showAutoProductionBadge: false, showTaxBadges: true, taxBadgeThreshold: 20, managementTabs: true, debug: false, debugOffsetX: 0, debugOffsetY: 0, alwaysDay: false, fineRotation: false, signInPrompt: true, advisor: false, advisorSuggestionsOpen: true, advisorContextLevel: 3, serviceCoverageType: 'school', matchSpeed: 1 });
  });

  it('keeps a stored Match speed only when it is one of the speeds on offer', () => {
    expect(parsePrefs(JSON.stringify({ matchSpeed: 0.25 })).matchSpeed).toBe(0.25);
    expect(parsePrefs(JSON.stringify({ matchSpeed: 3 })).matchSpeed).toBe(1);
  });

  it('keeps the sign-in prompt on unless the stored value is the boolean false', () => {
    expect(parsePrefs(JSON.stringify({ signInPrompt: false })).signInPrompt).toBe(false);
    expect(parsePrefs(JSON.stringify({ signInPrompt: 'no' })).signInPrompt).toBe(true);
    expect(parsePrefs(null).signInPrompt).toBe(true);
  });

  it('keeps the Advisor suggestions open unless the stored value is the boolean false', () => {
    expect(parsePrefs(null).advisorSuggestionsOpen).toBe(true);
    expect(parsePrefs(JSON.stringify({ advisorSuggestionsOpen: false })).advisorSuggestionsOpen).toBe(false);
    expect(parsePrefs(JSON.stringify({ advisorSuggestionsOpen: 'no' })).advisorSuggestionsOpen).toBe(true);
  });

  it('keeps the Advisor context level between 1 and 5, 3 by default', () => {
    expect(parsePrefs(null).advisorContextLevel).toBe(3);
    expect(parsePrefs(JSON.stringify({ advisorContextLevel: 5 })).advisorContextLevel).toBe(5);
    expect(parsePrefs(JSON.stringify({ advisorContextLevel: 9 })).advisorContextLevel).toBe(3);
    expect(parsePrefs(JSON.stringify({ advisorContextLevel: '2' })).advisorContextLevel).toBe(3);
  });

  it('keeps the Advisor off unless the stored value is the boolean true', () => {
    expect(parsePrefs(null).advisor).toBe(false);
    expect(parsePrefs(JSON.stringify({ advisor: true })).advisor).toBe(true);
    expect(parsePrefs(JSON.stringify({ advisor: 'yes' })).advisor).toBe(false);
  });

  it('shows the reach of public buildings by default', () => {
    expect(parsePrefs(JSON.stringify({ showReach: 'no' })).showReach).toBe(true);
  });

  it('reads the tax badge threshold and falls back on bad values', () => {
    expect(parsePrefs(JSON.stringify({ taxBadgeThreshold: 50 })).taxBadgeThreshold).toBe(50);
    expect(parsePrefs(JSON.stringify({ taxBadgeThreshold: 1 })).taxBadgeThreshold).toBe(1);
    expect(parsePrefs(JSON.stringify({ taxBadgeThreshold: 42 })).taxBadgeThreshold).toBe(20);
    expect(parsePrefs(null).taxBadgeThreshold).toBe(20);
  });

  it('keeps Traffic on for preferences saved before it existed', () => {
    expect(parsePrefs(JSON.stringify({ language: 'fr', layout: 'A' }))).toEqual({ language: 'fr', layout: 'A', traffic: true, pedestrians: true, pedestrianModel: 'stickman', trafficDensity: 'normal', pedestrianDensity: 'normal', confirmSale: true, showReach: true, showProductionPreview: true, showRecipeStock: false, showAutoProductionBadge: false, showTaxBadges: true, taxBadgeThreshold: 20, managementTabs: true, debug: false, debugOffsetX: 0, debugOffsetY: 0, alwaysDay: false, fineRotation: false, signInPrompt: true, advisor: false, advisorSuggestionsOpen: true, advisorContextLevel: 3, serviceCoverageType: 'school', matchSpeed: 1 });
  });

  it('remembers a valid service type and defaults to School for obsolete or invalid choices', () => {
    expect(parsePrefs(JSON.stringify({ serviceCoverageType: 'mosque' })).serviceCoverageType).toBe('mosque');
    for (const serviceCoverageType of ['removed-service', 'home', null, 42]) {
      expect(parsePrefs(JSON.stringify({ serviceCoverageType })).serviceCoverageType).toBe('school');
    }
  });

  it('persists the selected service without persisting whether the heatmap is open', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    try {
      prefsStore.getState().setServiceCoverageType('policeStation');
      const [key, raw] = setItem.mock.calls[0]!;
      expect(key).toBe(PREFS_KEY);
      expect(parsePrefs(raw).serviceCoverageType).toBe('policeStation');
      expect(JSON.parse(raw)).not.toHaveProperty('serviceCoverageOpen');
    } finally {
      prefsStore.getState().setServiceCoverageType('school');
      vi.unstubAllGlobals();
    }
  });
});

describe('pedestrian model preference', () => {
  it('is stick figures by default, and keeps a valid choice', () => {
    expect(parsePrefs(null).pedestrianModel).toBe('stickman');
    expect(parsePrefs(JSON.stringify({ pedestrianModel: 'avatar' })).pedestrianModel).toBe('avatar');
    expect(parsePrefs(JSON.stringify({ pedestrianModel: 'robot' })).pedestrianModel).toBe('stickman');
  });

  it('is saved in the local storage with the other preferences', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
    prefsStore.getState().setPedestrianModel('avatar');
    expect(JSON.parse(storage.get(PREFS_KEY)!).pedestrianModel).toBe('avatar');
    prefsStore.getState().setPedestrianModel('stickman');
    expect(JSON.parse(storage.get(PREFS_KEY)!).pedestrianModel).toBe('stickman');
    vi.unstubAllGlobals();
  });
});

describe('debug pick offset preference', () => {
  it('is zero by default and stays within the limits', () => {
    expect(parsePrefs(null)).toMatchObject({ debugOffsetX: 0, debugOffsetY: 0 });
    expect(parsePrefs(JSON.stringify({ debugOffsetX: 12, debugOffsetY: -7 }))).toMatchObject({ debugOffsetX: 12, debugOffsetY: -7 });
    expect(parsePrefs(JSON.stringify({ debugOffsetX: 999, debugOffsetY: -999 }))).toMatchObject({ debugOffsetX: DEBUG_OFFSET_LIMIT, debugOffsetY: -DEBUG_OFFSET_LIMIT });
    expect(parsePrefs(JSON.stringify({ debugOffsetX: 'a', debugOffsetY: 1.5 }))).toMatchObject({ debugOffsetX: 0, debugOffsetY: 0 });
  });

  it('is saved in the local storage', () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
    prefsStore.getState().setDebugOffset('x', 8);
    prefsStore.getState().setDebugOffset('y', -999);
    expect(JSON.parse(storage.get(PREFS_KEY)!)).toMatchObject({ debugOffsetX: 8, debugOffsetY: -DEBUG_OFFSET_LIMIT });
    prefsStore.getState().setDebugOffset('x', 0);
    prefsStore.getState().setDebugOffset('y', 0);
    vi.unstubAllGlobals();
  });
});
