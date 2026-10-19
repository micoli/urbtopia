import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { CURRENT_VERSION, parseEnvelope, serializeEnvelope } from './envelope';
import { MIGRATIONS } from './migrations';

const fixtureText = (version: number) => readFileSync(new URL(`./fixtures/save-v${version}.json`, import.meta.url), 'utf8');
const versions = Array.from({ length: CURRENT_VERSION }, (_, index) => index + 1);

// Update this snapshot together with CURRENT_VERSION: a schema change needs a migration and a new frozen fixture.
const SCHEMA_SNAPSHOT = {
  version: 16,
  keys: [
    'adaptationUntil', 'brtRoads', 'buildings', 'busLines', 'casinoRng', 'fields', 'lastSeen', 'market', 'marketUnlocked', 'nextId',
    'ownedParcels', 'rails', 'rngState', 'roads', 'roundabouts', 'seed', 'seedStock', 'storage', 'tradeLedger', 'transitFleet', 'transitLines', 'tutorial', 'urbs',
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

  it('turns the Silo of a version-12 city into a Material depot', () => {
    const v12 = JSON.parse(fixtureText(12));
    v12.state.buildings.push({ ...v12.state.buildings[0], id: 9, type: 'silo', x: 50, y: 53 });
    const loaded = parseEnvelope(JSON.stringify(v12));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.buildings.map((building) => building.type)).toContain('materialDepot');
    expect(loaded.state.buildings.map((building) => building.type)).not.toContain('silo');
  });

  it('gives a version-13 city an empty trade ledger and changes nothing else', () => {
    const v13 = JSON.parse(fixtureText(13));
    const loaded = parseEnvelope(JSON.stringify(v13));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state).toEqual({ ...v13.state, tradeLedger: [] });
  });

  it('marks the Venue tutorial of a Venue already placed in a version-14 city as finished, and adds none otherwise', () => {
    const v14 = JSON.parse(fixtureText(14));
    const withoutVenue = parseEnvelope(JSON.stringify(v14));
    if (!withoutVenue.ok) throw new Error(withoutVenue.reason);
    expect(withoutVenue.state.venueTutorials).toBeUndefined();

    const arcade = { ...v14.state.buildings[0], id: 9, type: 'arcade', x: 60, y: 50, venue: { fixtures: [], nextFixtureId: 1, takings: 0 } };
    const withArcade = parseEnvelope(JSON.stringify({ ...v14, state: { ...v14.state, buildings: [...v14.state.buildings, arcade] } }));
    if (!withArcade.ok) throw new Error(withArcade.reason);
    expect(withArcade.state.venueTutorials).toEqual({ arcade: null });
  });

  it('keeps a trade ledger across a round trip and refuses a damaged one', () => {
    const v14 = JSON.parse(fixtureText(14));
    const entry = { offerId: 'offer-1', effect: 'reserve-lot', at: 1, lot: [{ item: 'wood', quantity: 3 }], peer: 'someone', confirmed: false };
    const withLedger = { ...v14, state: { ...v14.state, tradeLedger: [entry] } };
    const loaded = parseEnvelope(JSON.stringify(withLedger));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.tradeLedger).toEqual([entry]);
    expect(parseEnvelope(serializeEnvelope(loaded.state, loaded.savedAt))).toEqual(loaded);

    const damaged = (change: object) => parseEnvelope(JSON.stringify({ ...v14, state: { ...v14.state, tradeLedger: [{ ...entry, ...change }] } }));
    expect(damaged({ effect: 'teleport' })).toMatchObject({ ok: false, reason: 'invalid-state' });
    expect(damaged({ lot: [{ item: 'unobtainium', quantity: 1 }] })).toMatchObject({ ok: false, reason: 'invalid-state' });
    expect(damaged({ lot: [{ item: 'wood', quantity: 0 }] })).toMatchObject({ ok: false, reason: 'invalid-state' });
    expect(damaged({ confirmed: 'yes' })).toMatchObject({ ok: false, reason: 'invalid-state' });
    expect(damaged({ urbs: -1 })).toMatchObject({ ok: false, reason: 'invalid-state' });
    expect(parseEnvelope(JSON.stringify({ ...v14, state: { ...v14.state, tradeLedger: 'nope' } }))).toMatchObject({ ok: false, reason: 'invalid-state' });
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

describe('Challenge progress in the save', () => {
  const v14 = JSON.parse(fixtureText(14));
  const challenge = { id: 'c1', goal: [{ item: 'wood', quantity: 5 }], stock: { wood: 2 }, deadline: 1_700_086_400_000 };
  const load = (value: unknown) => parseEnvelope(JSON.stringify({ ...v14, state: { ...v14.state, challenge: value } }));

  it('loads a save without any Challenge', () => {
    const loaded = parseEnvelope(JSON.stringify(v14));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.challenge).toBeUndefined();
  });

  it('keeps an accepted Challenge and its stock', () => {
    const loaded = load(challenge);
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.challenge).toEqual(challenge);
  });

  it('refuses a damaged Challenge', () => {
    for (const damaged of [{ ...challenge, id: '' }, { ...challenge, goal: [] }, { ...challenge, stock: { wood: 6 } }, { ...challenge, stock: { stone: 1 } }, { ...challenge, deadline: 'soon' }, 'nope']) {
      expect(load(damaged), JSON.stringify(damaged)).toMatchObject({ ok: false, reason: 'invalid-state' });
    }
  });
});

describe('Challenge claims in the save', () => {
  const v14 = JSON.parse(fixtureText(14));
  const load = (value: unknown) => parseEnvelope(JSON.stringify({ ...v14, state: { ...v14.state, challengeClaims: value } }));

  it('keeps the claims', () => {
    const loaded = load([{ id: 'c1', at: 1_700_000_000_000, urbs: 90 }]);
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.challengeClaims).toHaveLength(1);
  });

  it('refuses damaged claims', () => {
    for (const damaged of ['nope', [{ id: '', at: 1, urbs: 1 }], [{ id: 'c1', at: 1, urbs: -1 }], [{ id: 'c1', at: 'x', urbs: 1 }]]) {
      expect(load(damaged), JSON.stringify(damaged)).toMatchObject({ ok: false, reason: 'invalid-state' });
    }
  });
});

describe('Waste Adaptation period for a saved city', () => {
  const v15 = JSON.parse(fixtureText(15));
  const withCitizens = (tiers: number[]) => {
    const homes = tiers.map((tier, index) => ({ ...v15.state.buildings[0], id: 20 + index, x: 70 + index * 3, y: 70, tier }));
    return parseEnvelope(JSON.stringify({ ...v15, state: { ...v15.state, nextId: 100, buildings: [...v15.state.buildings, ...homes] } }));
  };

  it('starts one for a version-15 city above 1000 Citizens', () => {
    const loaded = withCitizens([8, 8, 8]);
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.adaptationUntil).toBe(v15.state.lastSeen + 24 * 3_600_000);
  });

  it('leaves a smaller version-15 city unchanged', () => {
    const loaded = withCitizens([8]);
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(loaded.state.adaptationUntil).toBe(v15.state.adaptationUntil);
  });
});
