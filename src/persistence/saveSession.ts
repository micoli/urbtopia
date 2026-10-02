import type { GameState } from '../core';
import { parseEnvelope, serializeEnvelope, type ParseFailure } from './envelope';
import { SAVE_KEY, SaveQuotaError, type SaveStore } from './saveStore';

export type LoadResult =
  | { kind: 'none' }
  | { kind: 'loaded'; state: GameState; savedAt: number }
  | { kind: 'failed'; reason: ParseFailure; raw: string };

export type SaveOutcome = { ok: true } | { ok: false; reason: 'locked' | 'quota' };

export class SaveSession {
  private locked = false;

  constructor(private store: SaveStore) {}

  load(): LoadResult {
    const raw = this.store.get(SAVE_KEY);
    if (raw === null) return { kind: 'none' };
    const result = parseEnvelope(raw);
    if (result.ok) return { kind: 'loaded', state: result.state, savedAt: result.savedAt };
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

  unlock(): void {
    this.locked = false;
  }
}
