import type { GameState } from '../core';
import { CURRENT_VERSION, parseEnvelope, serializeEnvelope } from './envelope';
import { BACKUP_KEY, SAVE_KEY, versionedBackupKey, type SaveStore } from './saveStore';
import type { SaveSession } from './saveSession';

export { BACKUP_KEY };

export function exportFileName(state: GameState, now: number): string {
  return `urbtopia-${state.seed}-${new Date(now).toISOString().slice(0, 10)}.json`;
}

export type RestoreResult = { ok: true; state: GameState } | { ok: false; reason: 'no-backup' };

function backupKeysNewestFirst(): string[] {
  const versions = Array.from({ length: CURRENT_VERSION }, (_, index) => CURRENT_VERSION - index);
  return [BACKUP_KEY, ...versions.map(versionedBackupKey)];
}

export function hasBackup(store: SaveStore): boolean {
  return backupKeysNewestFirst().some((key) => store.get(key) !== null);
}

export function restoreBackup(store: SaveStore, session: SaveSession): RestoreResult {
  for (const key of backupKeysNewestFirst()) {
    const raw = store.get(key);
    const parsed = raw === null ? null : parseEnvelope(raw);
    if (raw === null || !parsed?.ok) continue;
    store.put(SAVE_KEY, raw);
    session.unlock();
    return { ok: true, state: parsed.state };
  }
  return { ok: false, reason: 'no-backup' };
}


// The City name rides next to the envelope, outside the state, so the format version does not change.
export function exportEnvelope(state: GameState, savedAt: number, cityName: string | null): string {
  const envelope = JSON.parse(serializeEnvelope(state, savedAt)) as Record<string, unknown>;
  return JSON.stringify(cityName === null ? envelope : { ...envelope, cityName });
}

export function readExportedCityName(text: string): string | null {
  try {
    const parsed = JSON.parse(text) as { cityName?: unknown };
    return typeof parsed.cityName === 'string' && parsed.cityName.trim() !== '' ? parsed.cityName.trim() : null;
  } catch {
    return null;
  }
}
