import type { GameState } from '../core';
import { migrate } from './migrations';
import { validateGameState } from './validate';

export const FORMAT = 'urbtopia-save';
export const CURRENT_VERSION = 1;

export type ParseFailure = 'invalid-json' | 'wrong-format' | 'newer-version' | 'invalid-state';

export type ParseResult = { ok: true; state: GameState; savedAt: number } | { ok: false; reason: ParseFailure };

export function serializeEnvelope(state: GameState, savedAt: number): string {
  return JSON.stringify({ format: FORMAT, version: CURRENT_VERSION, savedAt, state });
}

export function parseEnvelope(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }
  if (typeof parsed !== 'object' || parsed === null) return { ok: false, reason: 'wrong-format' };
  const envelope = parsed as Record<string, unknown>;
  if (envelope.format !== FORMAT || !Number.isInteger(envelope.version) || typeof envelope.savedAt !== 'number' || !('state' in envelope)) {
    return { ok: false, reason: 'wrong-format' };
  }
  const version = envelope.version as number;
  if (version > CURRENT_VERSION) return { ok: false, reason: 'newer-version' };

  let migrated: unknown;
  try {
    migrated = migrate(envelope.state, version, CURRENT_VERSION);
  } catch {
    return { ok: false, reason: 'invalid-state' };
  }
  const state = validateGameState(migrated);
  return state ? { ok: true, state, savedAt: envelope.savedAt } : { ok: false, reason: 'invalid-state' };
}
