import type { GameState } from '../core';
import { MIGRATIONS, migrate, type MigrationStep } from './migrations';
import { validateGameState } from './validate';

export const FORMAT = 'urbtopia-save';
export const CURRENT_VERSION = 7;

export type ParseFailure = 'invalid-json' | 'wrong-format' | 'newer-version' | 'invalid-state';

export interface ParseOptions {
  currentVersion?: number;
  steps?: Record<number, MigrationStep>;
}

export type ParseResult = { ok: true; state: GameState; savedAt: number } | { ok: false; reason: ParseFailure };

export function serializeEnvelope(state: GameState, savedAt: number): string {
  return JSON.stringify({ format: FORMAT, version: CURRENT_VERSION, savedAt, state });
}

export function readVersion(text: string): number | null {
  try {
    const parsed = JSON.parse(text) as { version?: unknown };
    return Number.isInteger(parsed.version) ? (parsed.version as number) : null;
  } catch {
    return null;
  }
}

export function parseEnvelope(text: string, { currentVersion = CURRENT_VERSION, steps = MIGRATIONS }: ParseOptions = {}): ParseResult {
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
  if (version > currentVersion) return { ok: false, reason: 'newer-version' };

  let migrated: unknown;
  try {
    migrated = migrate(envelope.state, version, currentVersion, steps);
  } catch {
    return { ok: false, reason: 'invalid-state' };
  }
  const state = validateGameState(migrated);
  return state ? { ok: true, state, savedAt: envelope.savedAt } : { ok: false, reason: 'invalid-state' };
}
