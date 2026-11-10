import { describe, expect, it } from 'vitest';
import { createBuilding, newGame } from '../core';
import { layoutOf } from '../core/replan/layout';
import { liftBuilding, liftBoat } from '../core/replan';
import { showcaseContent } from '../showcase/showcaseEnvelope';
import { parseEnvelope, serializeEnvelope } from './envelope';
import type { GameState } from '../core';

const T0 = 1_700_000_000_000;

function city(): GameState {
  const base = newGame({ seed: 'replan-save', now: T0 });
  return {
    ...base,
    roads: [{ x: 50, y: 50, kind: 'road' as const }],
    buildings: [createBuilding(100, 'marina', 50, 48, 0), { ...createBuilding(101, 'home', 56, 57, 0), tier: 2 }],
    waterTiles: [{ x: 51, y: 50 }, { x: 52, y: 50 }],
    boats: [{ id: 200, family: 'pleasure', marinaId: 100, x: 51, y: 50 }],
    nextId: 300,
  };
}

function ok(outcome: { state: GameState } | { key: string }): GameState {
  if (!('state' in outcome)) throw new Error(outcome.key);
  return outcome.state;
}

function replanning(): GameState {
  const state = city();
  const lifted = ok(liftBuilding(ok(liftBuilding(ok(liftBoat(state, 200)), 100)), 101));
  return { ...lifted, replan: { ...lifted.replan!, start: layoutOf(state) } };
}

describe('a Replan in the save', () => {
  it('loads a save without a Replan as a City with none in progress', () => {
    const state = city();
    const loaded = parseEnvelope(serializeEnvelope(state, 100));
    expect(loaded).toEqual({ ok: true, state, savedAt: 100 });
    expect(loaded.ok && loaded.state.replan).toBeUndefined();
  });

  it('round-trips a Replan with its Stash and its starting layout, and resumes it', () => {
    const state = replanning();
    expect(state.buildings).toHaveLength(0);
    expect(state.replan?.stash.buildings).toHaveLength(2);
    expect(parseEnvelope(serializeEnvelope(state, 100))).toEqual({ ok: true, state, savedAt: 100 });
  });

  it('accepts objects placed before what they need while it lasts', () => {
    const state = replanning();
    const early = { ...state, boats: [{ id: 201, family: 'pleasure' as const, marinaId: 100, x: 40, y: 40 }], waterTiles: [] };
    expect(parseEnvelope(serializeEnvelope(early, 100)).ok).toBe(true);
    const withoutReplan = { ...city(), boats: early.boats, waterTiles: [] };
    expect(parseEnvelope(serializeEnvelope(withoutReplan, 100)).ok).toBe(false);
  });

  it.each([
    ['without a starting layout', (state: GameState) => ({ ...state, replan: { stash: state.replan!.stash } })],
    ['with an unknown list in the Stash', (state: GameState) => ({ ...state, replan: { ...state.replan!, stash: { ...state.replan!.stash, trucks: [] } } })],
    ['with a broken tile in the Stash', (state: GameState) => ({ ...state, replan: { ...state.replan!, stash: { ...state.replan!.stash, roads: [{ x: -1, y: 0, kind: 'road' }] } } })],
    ['with an id already on the map', (state: GameState) => ({ ...state, buildings: [createBuilding(100, 'home', 60, 60, 0)] })],
  ])('rejects a Replan %s', (_label, change) => {
    expect(parseEnvelope(serializeEnvelope(change(replanning()) as GameState, 100))).toMatchObject({ ok: false, reason: 'invalid-state' });
  });

  it('keeps the City out of the Showcase while it lasts', () => {
    expect(showcaseContent(serializeEnvelope(city(), 100))).not.toBeNull();
    expect(showcaseContent(serializeEnvelope(replanning(), 100))).toBeNull();
  });
});
