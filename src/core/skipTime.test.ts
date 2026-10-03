import { describe, expect, it } from 'vitest';
import { advance, dispatch, newGame, type Command, type GameState } from './index';

const T0 = 1_700_000_000_000;
const MINUTE = 60 * 1000;

function succeed(state: GameState, command: Command, now: number): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

const WORKSHOP_ID = 1;
const queueOf = (state: GameState) => state.buildings.find((b) => b.id === WORKSHOP_ID)?.queue ?? [];

const initial = newGame({ seed: 'amber-fox-4821', now: T0 });
const withStorehouse = succeed(initial, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 }, T0);
const queued = succeed(withStorehouse, { type: 'QueueProduction', buildingId: WORKSHOP_ID, item: 'stone' }, T0);

const place = (buildingType: 'home' | 'powerPlant' | 'waterTower', x: number, y: number): Command => ({ type: 'PlaceBuilding', buildingType, x, y });
const powered = succeed(succeed({ ...initial, urbs: 10_000 }, place('powerPlant', 70, 70), T0), place('waterTower', 72, 70), T0);
const withHome = succeed(powered, place('home', 56, 57), T0);
const HOME_ID = withHome.buildings.find((b) => b.type === 'home')?.id ?? 0;

describe('SkipTime', () => {
  it('completes the production that would have finished within the skipped hours', () => {
    const skipped = dispatch(queued, { type: 'SkipTime', hours: 12 }, T0);
    if (!skipped.ok) throw new Error(skipped.error.key);
    expect(queueOf(skipped.state).map((entry) => entry.done)).toEqual([true]);
    expect(skipped.events.map((event) => event.type)).toContain('ProductionCompleted');
  });

  it('makes the produced Material collectable right away', () => {
    const skipped = succeed(queued, { type: 'SkipTime', hours: 12 }, T0);
    const collected = succeed(skipped, { type: 'Collect', buildingId: WORKSHOP_ID }, T0);
    expect(collected.storage.materials.stone).toBe(1);
  });

  it('leaves the clock on now, so the game keeps running in real time afterwards', () => {
    const skipped = succeed(queued, { type: 'SkipTime', hours: 24 }, T0);
    expect(skipped.lastSeen).toBe(T0);
    const next = succeed(skipped, { type: 'QueueProduction', buildingId: WORKSHOP_ID, item: 'wood' }, T0);
    expect(queueOf(advance(next, T0 + MINUTE).state).map((entry) => entry.done)).toEqual([true, true]);
  });

  it('lets a Home accumulate its Tax, up to the 8 hour cap', () => {
    const skipped = succeed(withHome, { type: 'SkipTime', hours: 12 }, T0);
    const collected = succeed(skipped, { type: 'Collect', buildingId: HOME_ID }, T0);
    expect(collected.urbs - withHome.urbs).toBe(48);
  });
});
