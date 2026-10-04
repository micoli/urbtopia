import { describe, expect, it } from 'vitest';
import { FACILITY_TYPES, createBuilding, newGame } from '../core';
import saveV7 from './fixtures/save-v7.json';
import saveV8 from './fixtures/save-v8.json';
import { parseEnvelope, serializeEnvelope } from './envelope';

const DAY = 24 * 3_600_000;

describe('public facilities save compatibility', () => {
  it('loads a frozen version-8 city with Public facilities unchanged', () => {
    expect(parseEnvelope(JSON.stringify(saveV8))).toEqual({ ok: true, state: { ...saveV8.state, seedStock: {}, fields: [] }, savedAt: saveV8.savedAt });
  });

  it('keeps Home Tiers of a version-7 save and starts an Adaptation period', () => {
    const loaded = parseEnvelope(JSON.stringify(saveV7));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state.buildings).toEqual(saveV7.state.buildings);
    expect(loaded.state.adaptationUntil).toBe(saveV7.state.lastSeen + DAY);
  });

  it('round-trips every Public facility', () => {
    const buildings = FACILITY_TYPES.map((type, index) => createBuilding(index + 1, type, 50 + index, 50, 0));
    const state = { ...newGame({ seed: 'facilities-save', now: 0 }), nextId: buildings.length + 1, buildings };
    const loaded = parseEnvelope(serializeEnvelope(state, 100));
    expect(loaded).toEqual({ ok: true, state, savedAt: 100 });
  });
});
