import type { GameState } from '../core';
import { CURRENT_VERSION, parseEnvelope, readVersion, serializeEnvelope, type ParseFailure, type ParseOptions, type SavedPrefs } from './envelope';
import { BACKUP_KEY, SAVE_KEY, SaveQuotaError, versionedBackupKey, type SaveStore } from './saveStore';

// The save format that holds the Achievements; an older save has them seeded from its state when it loads.
const ACHIEVEMENTS_VERSION = 22;

export type LoadResult =
  | { kind: 'none' }
  | { kind: 'loaded'; state: GameState; savedAt: number; prefs: SavedPrefs; seededAchievements: number }
  | { kind: 'failed'; reason: ParseFailure; detail?: string; raw: string };

export type SaveOutcome = { ok: true } | { ok: false; reason: 'locked' | 'quota' };

export class SaveSession {
  private locked = false;

  constructor(
    private store: SaveStore,
    private options: ParseOptions = {},
  ) {}

  load(): LoadResult {
    const raw = this.store.get(SAVE_KEY);
    if (raw === null) return { kind: 'none' };
    const result = parseEnvelope(raw, this.options);
    if (result.ok) {
      const version = readVersion(raw) ?? CURRENT_VERSION;
      if (version < (this.options.currentVersion ?? CURRENT_VERSION)) this.backUpBeforeMigration(version, raw);
      const seededAchievements = version < ACHIEVEMENTS_VERSION ? (result.state.achievements?.length ?? 0) : 0;
      return { kind: 'loaded', state: result.state, savedAt: result.savedAt, prefs: result.prefs, seededAchievements };
    }
    this.locked = true;
    return { kind: 'failed', reason: result.reason, detail: result.detail, raw };
  }

  save(state: GameState, now: number, prefs: SavedPrefs = {}): SaveOutcome {
    if (this.locked) return { ok: false, reason: 'locked' };
    try {
      this.store.put(SAVE_KEY, serializeEnvelope(state, now, prefs));
      return { ok: true };
    } catch (error) {
      if (error instanceof SaveQuotaError) return { ok: false, reason: 'quota' };
      throw error;
    }
  }

  private backUpBeforeMigration(version: number, raw: string): void {
    this.store.put(BACKUP_KEY, raw);
    const key = versionedBackupKey(version);
    if (this.store.get(key) !== null) return;
    try {
      this.store.put(key, raw);
    } catch (error) {
      if (!(error instanceof SaveQuotaError)) throw error;
    }
  }

  backupNow(): void {
    const raw = this.store.get(SAVE_KEY);
    if (raw !== null && parseEnvelope(raw, this.options).ok) this.store.put(BACKUP_KEY, raw);
  }

  lock(): void {
    this.locked = true;
  }

  unlock(): void {
    this.locked = false;
  }
}
