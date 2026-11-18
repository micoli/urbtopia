import { prefsStore, savedPrefsOf } from '../i18n/prefsStore';
import type { SavedPrefs } from './envelope';

let loaded: SavedPrefs = {};
let applied: SavedPrefs = {};

const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

// What the save held is kept as read, unknown keys and unreadable values included: only a preference the Player changed since is overwritten.
export function adoptSavedPrefs(saved: SavedPrefs): void {
  prefsStore.getState().applySavedPrefs(saved);
  loaded = saved;
  applied = savedPrefsOf(prefsStore.getState());
}

export function currentSavedPrefs(): SavedPrefs {
  const saved = { ...loaded };
  for (const [key, value] of Object.entries(savedPrefsOf(prefsStore.getState()))) {
    const untouched = Object.hasOwn(loaded, key) && sameValue(value, applied[key]);
    if (!untouched) saved[key] = value;
  }
  return saved;
}
