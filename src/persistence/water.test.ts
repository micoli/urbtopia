import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { parseEnvelope, serializeEnvelope } from './envelope';

describe('water save compatibility', () => {
  it('loads a save without Water tiles unchanged', () => {
    const state = newGame({ seed: 'no-water', now: 0 });
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it('round-trips Water tiles', () => {
    const state = { ...newGame({ seed: 'water-save', now: 0 }), waterTiles: [{ x: 50, y: 50 }, { x: 51, y: 50 }] };
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it.each([
    [[{ x: -1, y: 50 }]],
    [[{ x: 50, y: 50 }, { x: 50, y: 50 }]],
    [[{ x: 50 }]],
  ])('rejects invalid Water tiles %j', waterTiles => {
    const state = { ...newGame({ seed: 'water-invalid', now: 0 }), waterTiles };
    expect(parseEnvelope(serializeEnvelope(state as never, 100))).toEqual({ ok: false, reason: 'invalid-state' });
  });
});
