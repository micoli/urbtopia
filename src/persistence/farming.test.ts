import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import saveV8 from './fixtures/save-v8.json';
import { CURRENT_VERSION, parseEnvelope, serializeEnvelope } from './envelope';

describe('farming save compatibility', () => {
  it('migrates a frozen version-8 city to version 9 with an empty seed stock and nothing else changed', () => {
    expect(CURRENT_VERSION).toBe(9);
    const loaded = parseEnvelope(JSON.stringify(saveV8));
    expect(loaded).toEqual({ ok: true, state: { ...saveV8.state, seedStock: {}, fields: [] }, savedAt: saveV8.savedAt });
  });

  it('round-trips a seed stock', () => {
    const state = { ...newGame({ seed: 'seed-stock-save', now: 0 }), seedStock: { wheat: 4, corn: 1 } };
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it('round-trips Crop Materials in the Materials compartment', () => {
    const state = { ...newGame({ seed: 'crop-materials-save', now: 0 }), storage: { materials: { wheat: 7, wood: 2 }, goods: {} } };
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it('round-trips Field tiles with and without a planted Crop', () => {
    const fields = [{ x: 50, y: 50 }, { x: 51, y: 50, crop: { species: 'wheat' as const, plantedAt: 1_700_000_000_000 } }];
    const state = { ...newGame({ seed: 'fields-save', now: 0 }), fields };
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it.each([
    [{ x: 50, y: 50, crop: { species: 'kale', plantedAt: 0 } }],
    [{ x: 50, y: 50, crop: { species: 'wheat' } }],
    [{ x: -1, y: 50 }],
  ])('rejects invalid Field tile %j', field => {
    const state = { ...newGame({ seed: 'fields-invalid', now: 0 }), fields: [field] };
    expect(parseEnvelope(serializeEnvelope(state as never, 100))).toEqual({ ok: false, reason: 'invalid-state' });
  });

  it.each([{ wheat: -1 }, { wheat: 1.5 }, { wheat: 'many' }])('rejects an invalid seed stock %j', seedStock => {
    const state = { ...newGame({ seed: 'seed-stock-invalid', now: 0 }), seedStock };
    expect(parseEnvelope(serializeEnvelope(state as never, 100))).toEqual({ ok: false, reason: 'invalid-state' });
  });
});
