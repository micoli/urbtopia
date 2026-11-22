export const ACHIEVEMENT_MEDAL_STORAGE_KEY = 'urbtopia:achievement-medals';

// The categories whose Medal the server has confirmed, by account.
export type MedalsDone = Record<string, string[]>;

export function readMedalsDone(): MedalsDone {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_MEDAL_STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as MedalsDone;
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter(([, list]) => Array.isArray(list) && list.every((category) => typeof category === 'string')));
  } catch {
    return {};
  }
}

export function writeMedalsDone(done: MedalsDone): boolean {
  try {
    localStorage.setItem(ACHIEVEMENT_MEDAL_STORAGE_KEY, JSON.stringify(done));
    return true;
  } catch {
    return false;
  }
}
