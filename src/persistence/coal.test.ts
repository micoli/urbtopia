import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, energyStats, newGame } from '../core';
import saveV4 from './fixtures/save-v4.json';
import saveV5 from './fixtures/save-v5.json';
import saveV6 from './fixtures/save-v6.json';
import { CURRENT_VERSION, parseEnvelope, serializeEnvelope } from './envelope';
import { validateGameState } from './validate';

describe('coal save compatibility', () => {
  it('preserves wind and backup plants in a frozen ecological city', () => {
    const loaded = parseEnvelope(JSON.stringify(saveV4));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.buildings).toEqual(saveV4.state.buildings);
    expect(loaded.state.storage).toEqual(saveV4.state.storage);
    expect(energyStats(loaded.state).coal).toBe(0);
  });

  it('migrates a frozen version-5 transit city without changing it beyond a service Adaptation period', () => {
    const loaded = parseEnvelope(JSON.stringify(saveV5));
    expect(loaded).toEqual({ ok: true, state: { ...saveV5.state, adaptationUntil: Math.max(saveV5.state.adaptationUntil, saveV5.state.lastSeen + 24 * 3_600_000) }, savedAt: saveV5.savedAt });
    if (!loaded.ok) return;
    expect(JSON.parse(serializeEnvelope(loaded.state, loaded.savedAt)).version).toBe(8);
    expect(CURRENT_VERSION).toBe(8);
    expect(parseEnvelope(serializeEnvelope(loaded.state, loaded.savedAt))).toEqual(loaded);
  });

  it('round-trips the frozen coal city, including disabled and upgraded plants', () => {
    const loaded = parseEnvelope(JSON.stringify(saveV6));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.buildings.find(b => b.id === 2)).toMatchObject({ type: 'coalPlant', tier: 4, coalEnabled: true });
    expect(loaded.state.buildings.find(b => b.id === 3)).toMatchObject({ coalEnabled: false });
    expect(energyStats(loaded.state).coalRates.get(3)).toBe(0);
    expect(parseEnvelope(serializeEnvelope(loaded.state, loaded.savedAt))).toEqual(loaded);
    const enabled = dispatch(loaded.state, { type: 'SetCoalEnabled', buildingId: 3, enabled: true }, loaded.state.lastSeen);
    expect(enabled.ok).toBe(true);
    if (!enabled.ok) return;
    const reloaded = parseEnvelope(serializeEnvelope(enabled.state, loaded.savedAt));
    expect(reloaded.ok && reloaded.state.buildings.find(b => b.id === 3)?.coalEnabled).toBe(true);
  });

  it.each([
    { tier: 5 }, { coalEnabled: 'yes' }, { coalEnabled: 1 }, { tier: 0 },
  ])('rejects invalid coal fields %j', patch => {
    const state = newGame({ seed: 'coal-validation', now: 0 });
    expect(validateGameState({ ...state, nextId: 51, buildings: [{ ...createBuilding(50, 'coalPlant', 50, 50, 0), ...patch }] })).toBeNull();
  });

  it('rejects coal controls attached to unrelated buildings', () => {
    expect(validateGameState({ ...saveV6.state, buildings: saveV6.state.buildings.map(b => b.type === 'home' ? { ...b, coalEnabled: true } : b) })).toBeNull();
  });
});
