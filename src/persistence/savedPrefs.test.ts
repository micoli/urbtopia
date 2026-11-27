import { describe, expect, it } from 'vitest';
import { DEVICE_PREF_KEYS, prefsStore } from '../i18n/prefsStore';
import { adoptSavedPrefs, currentSavedPrefs } from './savedPrefs';

describe('saved preferences', () => {
  it('keeps unknown keys and values of any shape as they were read', () => {
    const saved = { futureKey: { nested: [1, null, 'a'] }, another: 'x' };
    adoptSavedPrefs(saved);
    expect(currentSavedPrefs()).toMatchObject(saved);
  });

  it('keeps the unreadable value of a known key until the Player changes it', () => {
    prefsStore.getState().setConfirmSale(true);
    adoptSavedPrefs({ confirmSale: 'maybe' });
    expect(currentSavedPrefs().confirmSale).toBe('maybe');
    prefsStore.getState().setConfirmSale(false);
    expect(currentSavedPrefs().confirmSale).toBe(false);
    prefsStore.getState().setConfirmSale(true);
  });

  it('writes a preference the Player changed over the one that was read', () => {
    adoptSavedPrefs({ showReach: false });
    prefsStore.getState().setShowReach(true);
    expect(currentSavedPrefs().showReach).toBe(true);
  });

  it('carries a language change to another device but not a graphics-quality change', () => {
    adoptSavedPrefs({});
    prefsStore.getState().setLanguage('fr');
    prefsStore.getState().setShinyModels(false);
    const saved = currentSavedPrefs();
    expect(saved.language).toBe('fr');
    expect(saved).not.toHaveProperty('shinyModels');
    prefsStore.getState().setLanguage('en');
    prefsStore.getState().setShinyModels(true);
  });

  it('writes none of the device keys in the save', () => {
    adoptSavedPrefs({});
    for (const key of DEVICE_PREF_KEYS) expect(currentSavedPrefs()).not.toHaveProperty(key);
  });

  it('loads a save that still holds device keys and keeps the value of the device', () => {
    prefsStore.getState().setLayout('A');
    prefsStore.getState().setSunShadows(false);
    adoptSavedPrefs({ layout: 'B', sunShadows: true, language: 'en' });
    expect(prefsStore.getState().layout).toBe('A');
    expect(prefsStore.getState().sunShadows).toBe(false);
    expect(currentSavedPrefs()).not.toHaveProperty('layout');
    expect(currentSavedPrefs()).not.toHaveProperty('sunShadows');
    prefsStore.getState().setLayout('C');
    prefsStore.getState().setSunShadows(true);
  });

  it('adds the device value of a known key the save lacked', () => {
    adoptSavedPrefs({});
    expect(currentSavedPrefs()).toMatchObject({ language: prefsStore.getState().language });
  });
});
