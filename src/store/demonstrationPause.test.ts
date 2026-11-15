import { describe, expect, it, vi } from 'vitest';
import { advance, createBuilding, newGame, type GameState } from '../core';
import { cycleTimeOf } from '../core/environment/dayCycle';

vi.stubGlobal('window', { location: { search: '' } });
const { createGameStore } = await import('./gameStore');
const { catchUpInChunks } = await import('./catchUpInChunks');
const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;
function city(): GameState {
  const base = newGame({ now: T0, seed: 'demo-pause', tutorial: false });
  return { ...base, buildings: [...base.buildings, {
    ...createBuilding(900, 'workshop', 56, 57, 0),
    queue: [{ item: 'planks', duration: 2 * HOUR, startedAt: T0, done: false, quantity: 1 }],
  }] };
}

describe('City isolation during a guided demonstration', () => {
  it('blocks ticks, commands and chunked Catch-up until close', async () => {
    const initial = city();
    const store = createGameStore(initial);
    const resume = store.getState().suspend(T0);
    store.getState().tick(T0 + 50 * HOUR);
    store.getState().send({ type: 'SetDifficulty', difficulty: 'hard' });
    await catchUpInChunks(T0 + 50 * HOUR, store);
    expect(store.getState().state.urbs).toBe(initial.urbs);
    expect(store.getState().state.difficulty).toBe(initial.difficulty);
    expect(store.getState().state.storage).toEqual(initial.storage);
    expect(store.getState().paused).toBe(true);
    resume(T0 + 50 * HOUR);
    const resumed = store.getState().state;
    expect(store.getState().paused).toBe(false);
    expect(resumed.urbs).toBe(initial.urbs);
    expect(resumed.storage).toEqual(initial.storage);
    expect(resumed.adaptationUntil! - resumed.lastSeen).toBe(initial.adaptationUntil! - initial.lastSeen);
    expect(cycleTimeOf(resumed, T0 + 50 * HOUR)).toBe(cycleTimeOf(initial, T0));
    expect(resumed.buildings.find(building => building.id === 900)!.queue[0]!.startedAt).toBe(T0 + 50 * HOUR);
    const continued = advance(resumed, resumed.lastSeen + HOUR).state;
    expect(continued.buildings.find(building => building.id === 900)!.queue[0]!.done).toBe(false);
  });

  it('waits for the last lease and releases each pause exactly once', () => {
    const store = createGameStore(city());
    const first = store.getState().suspend(T0);
    const second = store.getState().suspend(T0 + HOUR);
    first(T0 + 2 * HOUR);
    expect(store.getState().paused).toBe(true);
    second(T0 + 3 * HOUR);
    const resumed = store.getState().state;
    expect(resumed.lastSeen).toBe(T0 + 3 * HOUR);
    first(T0 + 5 * HOUR);
    second(T0 + 5 * HOUR);
    expect(store.getState().state).toBe(resumed);
    expect(store.getState().paused).toBe(false);
  });
});
