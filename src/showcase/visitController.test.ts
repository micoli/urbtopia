import { describe, expect, it } from 'vitest';
import { newGame, type GameState } from '../core';
import { serializeEnvelope } from '../persistence/envelope';
import type { VisitState } from '../store/showcaseStore';
import { FakeShowcaseClient } from './fakeShowcaseClient';
import { VisitController } from './visitController';

const NOW = 1_700_000_000_000;
const own = newGame({ seed: 'own-city', now: NOW });
const theirs = newGame({ seed: 'their-city', now: NOW });

function setup(readOnlyAtStart = false) {
  const client = new FakeShowcaseClient();
  client.showcases.set('u2', { handle: 'Bob', avatar: null, formatVersion: 16, envelope: serializeEnvelope(theirs, NOW) });
  const game = { state: own as GameState, ticks: 0, changes: [] as string[] };
  const readOnly = { value: readOnlyAtStart, writes: [] as boolean[] };
  const states: VisitState[] = [];
  const controller = new VisitController({
    client,
    game: {
      state: () => game.state,
      replaceState: (state, change) => {
        game.state = state;
        game.changes.push(change);
      },
      tick: () => {
        game.ticks += 1;
      },
    },
    readOnly: {
      get: () => readOnly.value,
      set: (value) => {
        readOnly.value = value;
        readOnly.writes.push(value);
      },
    },
    now: () => NOW,
    onState: (state) => states.push(state),
  });
  return { client, controller, game, readOnly, states };
}

const last = (states: VisitState[]) => states[states.length - 1];

describe('VisitController', () => {
  it('swaps the visited city in, read-only', async () => {
    const { controller, game, readOnly, states } = setup();
    await controller.visit('u2');
    expect(game.state.seed).toBe(theirs.seed);
    expect(readOnly.value).toBe(true);
    expect(last(states)).toEqual({ kind: 'visiting', userId: 'u2', handle: 'Bob', avatar: null });
  });

  it('gives the player their own city back when leaving, and lets time catch up', async () => {
    const { controller, game, readOnly, states } = setup();
    await controller.visit('u2');
    controller.leave();
    expect(game.state).toBe(own);
    expect(readOnly.value).toBe(false);
    expect(game.ticks).toBe(1);
    expect(last(states)).toEqual({ kind: 'idle' });
  });

  it('keeps the tab read-only when it already was before the Visit', async () => {
    const { controller, readOnly } = setup(true);
    await controller.visit('u2');
    controller.leave();
    expect(readOnly.value).toBe(true);
  });

  it('keeps the original city across successive Visits', async () => {
    const { controller, game } = setup();
    await controller.visit('u2');
    await controller.visit('u2');
    controller.leave();
    expect(game.state).toBe(own);
  });

  it('reports a Showcase that is gone', async () => {
    const { controller, game, readOnly, states } = setup();
    await controller.visit('nobody');
    expect(last(states)).toEqual({ kind: 'failed', reason: 'not-found' });
    expect(game.state).toBe(own);
    expect(readOnly.writes).toEqual([]);
  });

  it('reports an offline server', async () => {
    const { client, controller, states } = setup();
    client.offline = true;
    await controller.visit('u2');
    expect(last(states)).toEqual({ kind: 'failed', reason: 'offline' });
  });

  it('refuses a Showcase of a newer format', async () => {
    const { client, controller, game, states } = setup();
    client.showcases.set('u3', { handle: 'Eve', avatar: null, formatVersion: 99, envelope: JSON.stringify({ format: 'urbtopia-save', version: 99, savedAt: NOW, state: {} }) });
    await controller.visit('u3');
    expect(last(states)).toEqual({ kind: 'failed', reason: 'newer-version' });
    expect(game.state).toBe(own);
  });

  it('refuses a Showcase that is not a valid city', async () => {
    const { client, controller, states } = setup();
    client.showcases.set('u3', { handle: 'Eve', avatar: null, formatVersion: 16, envelope: '{"nope":true}' });
    await controller.visit('u3');
    expect(last(states)).toEqual({ kind: 'failed', reason: 'invalid' });
  });

  it('drops the Visit without touching the game when the tab got its city back', async () => {
    const { controller, game, states } = setup();
    await controller.visit('u2');
    const before = game.changes.length;
    controller.abandon();
    expect(controller.visiting).toBe(false);
    expect(game.changes.length).toBe(before);
    expect(last(states)).toEqual({ kind: 'idle' });
  });
});
