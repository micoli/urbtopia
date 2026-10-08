import { describe, expect, it } from 'vitest';
import { createBuilding, newGame } from '../core';
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

describe('boat save compatibility', () => {
  const base = () => {
    const state = newGame({ seed: 'boat-save', now: 0 });
    return { ...state, nextId: 50, waterTiles: [{ x: 50, y: 50 }], buildings: [{ ...createBuilding(10, 'marina', 50, 48, 0) }] };
  };

  it('round-trips Boats', () => {
    const state = { ...base(), boats: [{ id: 11, family: 'pleasure' as const, marinaId: 10, x: 50, y: 50 }] };
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it('round-trips a Fishing boat with its catch clock', () => {
    const state = { ...base(), boats: [{ id: 11, family: 'fishing' as const, marinaId: 10, x: 50, y: 50, catchSince: 1_700_000_000_000 }] };
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it('round-trips a Casino boat with its Tier', () => {
    const state = { ...base(), boats: [{ id: 11, family: 'casino' as const, marinaId: 10, x: 50, y: 50, tier: 2 }] };
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it.each([
    [{ id: 11, family: 'casino', marinaId: 10, x: 50, y: 50, tier: 4 }],
    [{ id: 11, family: 'pleasure', marinaId: 10, x: 50, y: 50, tier: 2 }],
    [{ id: 11, family: 'pleasure', marinaId: 10, x: 50, y: 50, catchSince: 5 }],
    [{ id: 11, family: 'fishing', marinaId: 10, x: 50, y: 50, catchSince: 'now' }],
    [{ id: 11, family: 'yacht', marinaId: 10, x: 50, y: 50 }],
    [{ id: 11, family: 'pleasure', marinaId: 99, x: 50, y: 50 }],
    [{ id: 11, family: 'pleasure', marinaId: 10, x: 60, y: 60 }],
    [{ id: 10, family: 'pleasure', marinaId: 10, x: 50, y: 50 }],
  ])('rejects invalid Boat %j', boat => {
    const state = { ...base(), boats: [boat] };
    expect(parseEnvelope(serializeEnvelope(state as never, 100))).toEqual({ ok: false, reason: 'invalid-state' });
  });
});

describe('bridge save compatibility', () => {
  const base = () => ({
    ...newGame({ seed: 'bridge-save', now: 0 }),
    waterTiles: [{ x: 52, y: 50 }, { x: 53, y: 50 }],
    roads: [{ x: 52, y: 50, kind: 'road' as const }, { x: 53, y: 50, kind: 'road' as const }],
  });

  it('round-trips Bridges', () => {
    const state = { ...base(), bridges: [{ x: 52, y: 50, length: 2, axis: 'x' as const }] };
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it.each([
    [[{ x: 52, y: 50, length: 4, axis: 'x' }]],
    [[{ x: 52, y: 50, length: 2, axis: 'z' }]],
    [[{ x: 52, y: 50, length: 3, axis: 'x' }]],
    [[{ x: 52, y: 50, length: 2, axis: 'x' }, { x: 53, y: 50, length: 1, axis: 'x' }]],
  ])('rejects invalid Bridges %j', bridges => {
    expect(parseEnvelope(serializeEnvelope({ ...base(), bridges } as never, 100))).toEqual({ ok: false, reason: 'invalid-state' });
  });
});
