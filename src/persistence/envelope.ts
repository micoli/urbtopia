import { withoutOpenRound, type GameState } from '../core';
import { MIGRATIONS, migrate, type MigrationStep } from './migrations';
import { validateGameState } from './validate';

export const FORMAT = 'urbtopia-save';
export const CURRENT_VERSION = 16;

export type ParseFailure = 'invalid-json' | 'wrong-format' | 'newer-version' | 'invalid-state';

export interface ParseOptions {
  currentVersion?: number;
  steps?: Record<number, MigrationStep>;
}

function recoverFractionalShelfReturns(state: unknown): unknown {
  if (typeof state !== 'object' || state === null) return state;
  const value = state as Record<string, unknown>;
  if (typeof value.storage !== 'object' || value.storage === null) return state;
  const storage = value.storage as Record<string, unknown>;
  if (typeof storage.goods !== 'object' || storage.goods === null || Array.isArray(storage.goods)) return state;
  const goods = Object.fromEntries(Object.entries(storage.goods).map(([good, amount]) => [
    good,
    typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 && amount <= Number.MAX_SAFE_INTEGER ? Math.floor(amount) : amount,
  ]));
  return { ...value, storage: { ...storage, goods } };
}

export type ParseResult = { ok: true; state: GameState; savedAt: number } | { ok: false; reason: ParseFailure };

export function serializeEnvelope(state: GameState, savedAt: number): string {
  return JSON.stringify({ format: FORMAT, version: CURRENT_VERSION, savedAt, state: withoutOpenRound(state) });
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
  // Version 14 briefly returned fractional shelf stock to integer-only storage.
  const state = validateGameState(migrated) ?? (version === 14 ? validateGameState(recoverFractionalShelfReturns(migrated)) : null);
  return state ? { ok: true, state, savedAt: envelope.savedAt } : { ok: false, reason: 'invalid-state' };
}
