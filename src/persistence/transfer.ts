import { advance, type GameState } from '../core';
import { CURRENT_VERSION, parseEnvelope, type ParseFailure } from './envelope';
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

export type ImportResult = { ok: true; state: GameState } | { ok: false; reason: ParseFailure };

export function importCity(text: string, session: SaveSession, now: number): ImportResult {
  const parsed = parseEnvelope(text);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  session.backupNow();
  return { ok: true, state: advance(parsed.state, now).state };
}
