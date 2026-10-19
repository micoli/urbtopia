import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type GameState } from '../core';
import { parseEnvelope, serializeEnvelope } from './envelope';
import { checkGameState } from './validate';

const T0 = 1_700_000_000_000;
const state = newGame({ seed: 'amber-fox-4821', now: T0 });

function withMarina(): GameState {
  return { ...state, nextId: 50, waterTiles: [{ x: 50, y: 50 }], buildings: [createBuilding(10, 'marina', 50, 48, 0)] };
}

describe('checkGameState', () => {
  it('returns the state when it is valid', () => {
    expect(checkGameState(state)).toEqual({ ok: true, state });
  });

  it.each([
    ['a non-object', 'hello', 'state: expected an object'],
    ['a missing field', { ...state, urbs: undefined }, 'urbs'],
    ['a field of the wrong shape', { ...state, storage: 3 }, 'storage'],
    ['a list that is not a list', { ...state, roads: {} }, 'roads: expected a list'],
    ['a bad building', { ...state, buildings: [{ ...state.buildings[0], rotation: 7 }] }, 'buildings[0]'],
    ['a bad Water tile list', { ...state, waterTiles: [{ x: 1, y: 1 }, { x: 1, y: 1 }] }, 'waterTiles: duplicate tile'],
  ])('names the failing part for %s', (_label, value, reason) => {
    expect(checkGameState(value)).toEqual({ ok: false, reason });
  });

  it('names the index of the first bad element', () => {
    const roads = [{ x: 1, y: 1, kind: 'road' }, { x: 2, y: 1, kind: 'road' }, { x: 3, y: 1, kind: 'highway' }];
    expect(checkGameState({ ...state, roads })).toEqual({ ok: false, reason: 'roads[2]' });
  });

  it('names the broken invariant between parts of the state', () => {
    const boat = { id: 11, family: 'pleasure' as const, marinaId: 10, x: 50, y: 50 };
    expect(checkGameState({ ...withMarina(), boats: [boat] }).ok).toBe(true);
    expect(checkGameState({ ...withMarina(), boats: [{ ...boat, x: 60 }] })).toEqual({ ok: false, reason: 'boats[0]: not on a water tile' });
    expect(checkGameState({ ...withMarina(), boats: [{ ...boat, marinaId: 99 }] })).toEqual({ ok: false, reason: 'boats[0]: its marina does not exist' });
    expect(checkGameState({ ...withMarina(), buildings: [createBuilding(10, 'marina', 50, 48, 0), createBuilding(10, 'shop', 60, 60, 0)] })).toEqual({ ok: false, reason: 'ids: duplicate' });
    expect(checkGameState({ ...withMarina(), nextId: 10 })).toEqual({ ok: false, reason: 'ids: at or above nextId' });
  });

  it('rejects a trade ledger line with an unknown item or a quantity over the limit', () => {
    const entry = { offerId: 'o1', effect: 'reserve-lot', at: T0, confirmed: false };
    expect(checkGameState({ ...state, tradeLedger: [{ ...entry, lot: [{ item: 'wood', quantity: 2 }] }] }).ok).toBe(true);
    expect(checkGameState({ ...state, tradeLedger: [{ ...entry, lot: [{ item: 'unobtainium', quantity: 2 }] }] })).toEqual({ ok: false, reason: 'tradeLedger[0]' });
    expect(checkGameState({ ...state, tradeLedger: [{ ...entry, lot: [{ item: 'wood', quantity: 10_000 }] }] })).toEqual({ ok: false, reason: 'tradeLedger[0]' });
  });
});

describe('envelope failure detail', () => {
  it('carries the reason of an invalid state', () => {
    const text = serializeEnvelope({ ...state, urbs: -1 }, T0);
    expect(parseEnvelope(text)).toEqual({ ok: false, reason: 'invalid-state', detail: 'urbs' });
  });
});
