import type { GameState } from '../core';
import { CURRENT_VERSION, parseEnvelope, readVersion, serializeEnvelope, type ParseFailure, type ParseOptions } from './envelope';
import { BACKUP_KEY, SAVE_KEY, SaveQuotaError, type SaveStore } from './saveStore';

export type LoadResult =
  | { kind: 'none' }
  | { kind: 'loaded'; state: GameState; savedAt: number }
  | { kind: 'failed'; reason: ParseFailure; raw: string };

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
      if (version < (this.options.currentVersion ?? CURRENT_VERSION)) this.store.put(BACKUP_KEY, raw);
      return { kind: 'loaded', state: result.state, savedAt: result.savedAt };
    }
    this.locked = true;
    return { kind: 'failed', reason: result.reason, raw };
  }

  save(state: GameState, now: number): SaveOutcome {
    if (this.locked) return { ok: false, reason: 'locked' };
    try {
      this.store.put(SAVE_KEY, serializeEnvelope(state, now));
      return { ok: true };
    } catch (error) {
      if (error instanceof SaveQuotaError) return { ok: false, reason: 'quota' };
      throw error;
    }
  }

  backupNow(): void {
    const raw = this.store.get(SAVE_KEY);
    if (raw !== null && parseEnvelope(raw, this.options).ok) this.store.put(BACKUP_KEY, raw);
  }

  unlock(): void {
    this.locked = false;
  }
}
