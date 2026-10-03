import { describe, expect, it } from 'vitest';
import { createBuilding, greenBenefits, NATURE_TYPES, newGame } from '../core';
import saveV6 from './fixtures/save-v6.json';
import saveV7 from './fixtures/save-v7.json';
import { parseEnvelope, serializeEnvelope } from './envelope';

describe('nature save compatibility', () => {
  it('migrates a frozen version-6 city without changing its buildings or economy', () => {
    const loaded = parseEnvelope(JSON.stringify(saveV6));
    expect(loaded).toEqual({ ok: true, state: saveV6.state, savedAt: saveV6.savedAt });
    if (!loaded.ok) return;
    expect(JSON.parse(serializeEnvelope(loaded.state, loaded.savedAt)).version).toBe(7);
    expect(parseEnvelope(serializeEnvelope(loaded.state, loaded.savedAt), { currentVersion: 6 })).toEqual({ ok: false, reason: 'newer-version' });
  });

  it('loads a frozen version-7 mixed natural city without changing source state', () => {
    expect(parseEnvelope(JSON.stringify(saveV7))).toEqual({ ok: true, state: saveV7.state, savedAt: saveV7.savedAt });
  });

  it('round-trips every natural model and derives the same ecological benefits', () => {
    const home = createBuilding(1, 'home', 50, 50, 0);
    for (const type of NATURE_TYPES) {
      const state = { ...newGame({ seed: 'nature-save', now: 0 }), nextId: 3, buildings: [home, createBuilding(2, type, 51, 50, 1)] };
      const loaded = parseEnvelope(serializeEnvelope(state, 100));
      expect(loaded.ok, type).toBe(true);
      if (!loaded.ok) continue;
      expect(loaded.state.buildings).toEqual(state.buildings);
      expect(greenBenefits(loaded.state, home)).toEqual(greenBenefits(state, home));
    }
  });
});
