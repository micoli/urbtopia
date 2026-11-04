import { describe, expect, it } from 'vitest';
import { newGame } from '../core';
import { parseEnvelope, serializeEnvelope } from './envelope';

describe('underground save compatibility', () => {
  const base = () => ({ ...newGame({ seed: 'underground-save', now: 0 }), roads: [{ x: 50, y: 50, kind: 'road' as const }] });

  it('loads a save without underground as a city with no underground', () => {
    const state = base();
    const loaded = parseEnvelope(serializeEnvelope(state, 100));
    expect(loaded).toEqual({ ok: true, state, savedAt: 100 });
    expect(loaded.ok && loaded.state.walkways).toBeUndefined();
    expect(loaded.ok && loaded.state.tunnels).toBeUndefined();
    expect(loaded.ok && loaded.state.pedestrianAccesses).toBeUndefined();
  });

  it('round-trips walkways, tunnels and Pedestrian accesses', () => {
    const state = {
      ...base(),
      walkways: [{ x: 50, y: 50 }, { x: 51, y: 50 }],
      tunnels: [{ x: 50, y: 50, exits: ['E' as const] }, { x: 51, y: 50, exits: ['W' as const] }],
      pedestrianAccesses: [{ x: 52, y: 50 }],
    };
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it.each([
    ['walkways', [{ x: 1, y: 1 }, { x: 1, y: 1 }]],
    ['walkways', [{ x: -1, y: 1 }]],
    ['tunnels', [{ x: 1, y: 1, exits: ['E'] }, { x: 1, y: 1, exits: ['W'] }]],
    ['tunnels', [{ x: 1, y: 1, exits: ['up'] }]],
    ['pedestrianAccesses', [{ x: 2, y: 2 }, { x: 2, y: 2 }]],
    ['pedestrianAccesses', [{ x: 50, y: 50 }]],
  ])('rejects invalid %s %j', (key, value) => {
    expect(parseEnvelope(serializeEnvelope({ ...base(), [key]: value } as never, 100))).toMatchObject({ ok: false, reason: 'invalid-state' });
  });
});
