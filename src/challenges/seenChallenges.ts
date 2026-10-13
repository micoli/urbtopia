const STORAGE_KEY = 'urbtopia.seenChallenges';
const MAX_REMEMBERED = 200;

export function readSeenChallenges(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function writeSeenChallenges(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(-MAX_REMEMBERED)));
  } catch {
    // Storage may be unavailable or full: the badge then simply shows again next time.
  }
}
