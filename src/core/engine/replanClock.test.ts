import { describe, expect, it } from 'vitest';
import { createBuilding } from '../buildings/buildingSpecs';
import { cycleTimeOf } from '../environment/dayCycle';
import { advance } from './advance';
import { newGame } from './newGame';
import type { GameState } from './state';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;

function busyCity(): GameState {
  const base = newGame({ seed: 'replan-clock', now: T0 });
  const workshop = { ...createBuilding(900, 'workshop', 56, 57, 0), queue: [{ item: 'planks' as never, duration: 2 * HOUR, startedAt: T0, done: false, quantity: 1 }] };
  return { ...base, tutorial: null, buildings: [...base.buildings, workshop] };
}

describe('the game during a Replan', () => {
  it('stands still: no Urbs, no production, no Day cycle, no summary, however long it lasts', () => {
    const state = { ...busyCity(), replan: { stash: { buildings: [] } } };
    const before = cycleTimeOf(state, T0);
    const result = advance(state, T0 + 50 * HOUR);
    expect(result.events).toEqual([]);
    expect(result.state.urbs).toBe(state.urbs);
    expect(result.state.lastSeen).toBe(T0 + 50 * HOUR);
    expect(cycleTimeOf(result.state, T0 + 50 * HOUR)).toBe(before);
    expect(result.state.buildings.find((building) => building.id === 900)?.queue[0]?.done).toBe(false);
  });

  it('resumes where it stopped, with no Catch-up for the time spent', () => {
    const state = busyCity();
    const stopped = { ...advance(state, T0 + HOUR).state };
    const replanning = { ...stopped, replan: { stash: { buildings: [] } } };
    const resumed = { ...advance(replanning, T0 + 40 * HOUR).state, replan: undefined };
    const entry = resumed.buildings.find((building) => building.id === 900)?.queue[0];
    expect(entry?.done).toBe(false);
    expect(entry?.startedAt).toBe((stopped.buildings.find((building) => building.id === 900)?.queue[0]?.startedAt ?? 0) + 39 * HOUR);
    const later = advance(resumed, T0 + 40 * HOUR + 30 * 60 * 1000);
    expect(later.state.buildings.find((building) => building.id === 900)?.queue[0]?.done).toBe(false);
  });
});
