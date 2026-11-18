import { describe, expect, it } from 'vitest';
import { prefsStore } from '../i18n/prefsStore';
import { adoptSavedPrefs, currentSavedPrefs } from './savedPrefs';

describe('saved preferences', () => {
  it('keeps unknown keys and values of any shape as they were read', () => {
    const saved = { futureKey: { nested: [1, null, 'a'] }, another: 'x' };
    adoptSavedPrefs(saved);
    expect(currentSavedPrefs()).toMatchObject(saved);
  });

  it('keeps the unreadable value of a known key until the Player changes it', () => {
    prefsStore.getState().setTraffic(true);
    adoptSavedPrefs({ traffic: 'maybe' });
    expect(currentSavedPrefs().traffic).toBe('maybe');
    prefsStore.getState().setTraffic(false);
    expect(currentSavedPrefs().traffic).toBe(false);
  });

  it('writes a preference the Player changed over the one that was read', () => {
    adoptSavedPrefs({ layout: 'B' });
    prefsStore.getState().setLayout('A');
    expect(currentSavedPrefs().layout).toBe('A');
    prefsStore.getState().setLayout('C');
  });

  it('adds the device value of a known key the save lacked', () => {
    adoptSavedPrefs({});
    expect(currentSavedPrefs()).toMatchObject({ language: prefsStore.getState().language });
  });
});
