import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { CURRENT_VERSION, parseEnvelope } from './envelope';
import { MIGRATIONS } from './migrations';

const fixtureText = (version: number) => readFileSync(new URL(`./fixtures/save-v${version}.json`, import.meta.url), 'utf8');
const versions = Array.from({ length: CURRENT_VERSION }, (_, index) => index + 1);

// Update this snapshot together with CURRENT_VERSION: a schema change needs a migration and a new frozen fixture.
const SCHEMA_SNAPSHOT = {
  version: 12,
  keys: [
    'adaptationUntil', 'brtRoads', 'buildings', 'busLines', 'casinoRng', 'fields', 'lastSeen', 'market', 'marketUnlocked', 'nextId',
    'ownedParcels', 'rails', 'rngState', 'roads', 'roundabouts', 'seed', 'seedStock', 'storage', 'transitFleet', 'transitLines', 'tutorial', 'urbs',
  ],
};

describe('save migration contract', () => {
  it.each(versions)('has a frozen fixture for version %i that loads into the current version', (version) => {
    const result = parseEnvelope(fixtureText(version));
    expect(result.ok).toBe(true);
  });

  it('gives a version-10 city a congestion Adaptation period and keeps its roads at tier 1', () => {
    const v10 = JSON.parse(fixtureText(10));
    const loaded = parseEnvelope(JSON.stringify(v10));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.adaptationUntil).toBe(v10.state.lastSeen + 24 * 3_600_000);
    expect(loaded.state.roads).toEqual(v10.state.roads);
  });

  it('has one migration step per released version', () => {
    expect(Object.keys(MIGRATIONS).map(Number).sort((a, b) => a - b)).toEqual(versions.slice(0, -1));
  });

  it('keeps the schema in sync with CURRENT_VERSION', () => {
    const current = parseEnvelope(fixtureText(CURRENT_VERSION));
    if (!current.ok) throw new Error(current.reason);
    const keys = new Set([...Object.keys(newGame({ seed: 'schema', now: 0 })), ...Object.keys(current.state)]);
    expect({ version: CURRENT_VERSION, keys: [...keys].sort() }).toEqual(SCHEMA_SNAPSHOT);
  });
});
