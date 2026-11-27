import { describe, expect, it } from 'vitest';
import { createBuilding } from '../buildings/buildingSpecs';
import { cycleTimeOf } from '../environment/dayCycle';
import { advance, rebaseClock } from './advance';
import { newGame } from './newGame';
import type { GameState } from './state';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;
const HOUR = 3_600_000;

function busyCity(lastSeen: number): GameState {
  const base = newGame({ seed: 'rebase-clock', now: lastSeen });
  const workshop = { ...createBuilding(900, 'workshop', 56, 57, 0), queue: [{ item: 'planks' as never, duration: 2 * HOUR, startedAt: lastSeen, done: false, quantity: 1 }] };
  return { ...base, tutorial: null, buildings: [...base.buildings, workshop] };
}

describe('rebasing the game clock', () => {
  it('leaves a save that is not ahead of the device untouched', () => {
    const state = busyCity(T0);
    expect(rebaseClock(state, T0)).toBe(state);
    expect(rebaseClock(state, T0 + MINUTE)).toBe(state);
  });

  it('brings a save written three minutes ahead back to the device clock, timers included', () => {
    const state = busyCity(T0 + 3 * MINUTE);
    const rebased = rebaseClock(state, T0);
    expect(rebased.lastSeen).toBe(T0);
    expect(rebased.buildings.find((building) => building.id === 900)?.queue[0]?.startedAt).toBe(T0);
    expect(cycleTimeOf(rebased, rebased.lastSeen)).toBe(cycleTimeOf(state, state.lastSeen));
  });

  it('does not stall the game while the device clock catches up', () => {
    const state = busyCity(T0 + 3 * MINUTE);
    const stalled = advance(state, T0 + MINUTE);
    expect(stalled.state.lastSeen).toBe(T0 + 3 * MINUTE);

    const resumed = advance(rebaseClock(state, T0), T0 + MINUTE);
    expect(resumed.state.lastSeen).toBe(T0 + MINUTE);
  });

  it('replays nothing twice: the remaining time of a running timer is the same', () => {
    const state = busyCity(T0 + 3 * MINUTE);
    const rebased = rebaseClock(state, T0);
    const remaining = (game: GameState) => {
      const entry = game.buildings.find((building) => building.id === 900)?.queue[0];
      return (entry?.startedAt ?? 0) + (entry?.duration ?? 0) - game.lastSeen;
    };
    expect(remaining(rebased)).toBe(remaining(state));
  });
});
