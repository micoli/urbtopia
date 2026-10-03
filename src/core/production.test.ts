import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { advance, dispatch, isWorking, newGame, workProgress, type Command, type GameState } from './index';

const T0 = 1_700_000_000_000;
const SECOND = 1000;
const MINUTE = 60 * SECOND;

function succeed(state: GameState, command: Command, now: number): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function failureKey(state: GameState, command: Command, now: number): string | null {
  const result = dispatch(state, command, now);
  return result.ok ? null : result.error.key;
}

const WORKSHOP_ID = 1;
const FACTORY_ID = 2;
const queueWood = (buildingId = WORKSHOP_ID): Command => ({ type: 'QueueProduction', buildingId, item: 'wood' });
const queueStone = (buildingId = WORKSHOP_ID): Command => ({ type: 'QueueProduction', buildingId, item: 'stone' });
const collect = (buildingId = WORKSHOP_ID): Command => ({ type: 'Collect', buildingId });

const initial = newGame({ seed: 'amber-fox-4821', now: T0 });
const withStorehouse = succeed(initial, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 }, T0);
const queueOf = (state: GameState, id = WORKSHOP_ID) => state.buildings.find((b) => b.id === id)?.queue ?? [];

describe('QueueProduction', () => {
  it('starts a Material right away in an idle Workshop', () => {
    const state = succeed(initial, queueWood(), T0);
    expect(queueOf(state)).toEqual([{ item: 'wood', duration: MINUTE, startedAt: T0, done: false, quantity: 1 }]);
  });

  it('keeps a second Material waiting behind the first', () => {
    const state = succeed(succeed(initial, queueWood(), T0), queueStone(), T0);
    expect(queueOf(state).map((entry) => [entry.item, entry.startedAt])).toEqual([
      ['wood', T0],
      ['stone', null],
    ]);
  });

  it('refuses a third Material when the Workshop has 2 Slots', () => {
    const state = succeed(succeed(initial, queueWood(), T0), queueStone(), T0);
    expect(failureKey(state, queueWood(), T0)).toBe('error.queueFull');
  });

  it('refuses a Material in a Factory and an unknown building', () => {
    expect(failureKey(initial, queueWood(FACTORY_ID), T0)).toBe('error.cannotProduce');
    expect(failureKey(initial, queueWood(999), T0)).toBe('error.unknownBuilding');
  });
});

describe('advance with production', () => {
  const queued = succeed(succeed(initial, queueWood(), T0), queueStone(), T0);

  it('does not complete a Slot before its duration', () => {
    const { state, events } = advance(queued, T0 + MINUTE - 1);
    expect(queueOf(state)[0]?.done).toBe(false);
    expect(events).toEqual([]);
  });

  it('completes a Slot exactly at startedAt + duration and starts the next one at that instant', () => {
    const { state, events } = advance(queued, T0 + MINUTE);
    expect(queueOf(state).map((entry) => [entry.done, entry.startedAt])).toEqual([
      [true, T0],
      [false, T0 + MINUTE],
    ]);
    expect(events).toEqual([{ type: 'ProductionCompleted', buildingId: WORKSHOP_ID, item: 'wood', at: T0 + MINUTE }]);
  });

  it('replays several completions of one gap in chronological order', () => {
    const { state, events } = advance(queued, T0 + 10 * MINUTE);
    expect(queueOf(state).every((entry) => entry.done)).toBe(true);
    expect(events.map((event) => ('at' in event ? event.at : 0))).toEqual([T0 + MINUTE, T0 + 3 * MINUTE]);
  });

  it('gives the same state whether time is advanced in steps or at once', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10 * MINUTE }), fc.integer({ min: 0, max: 10 * MINUTE }), (a, b) => {
        const [first, second] = [T0 + Math.min(a, b), T0 + Math.max(a, b)];
        expect(advance(advance(queued, first).state, second).state).toEqual(advance(queued, second).state);
      }),
    );
  });
});

describe('dispatch brings the city up to date before acting', () => {
  it('lets the player collect what finished since the last tick', () => {
    const queued = succeed(withStorehouse, queueWood(), T0);
    const state = succeed(queued, collect(), T0 + MINUTE);
    expect(state.storage.materials.wood).toBe(1);
  });
});

describe('Collect', () => {
  const ready = advance(succeed(succeed(withStorehouse, queueWood(), T0), queueStone(), T0), T0 + 5 * MINUTE).state;

  it('moves finished Materials to the Storehouse and frees their Slots', () => {
    const state = succeed(ready, collect(), T0 + 5 * MINUTE);
    expect(state.storage.materials).toEqual({ wood: 1, stone: 1 });
    expect(queueOf(state)).toEqual([]);
  });

  it('refuses when nothing is finished', () => {
    const running = succeed(withStorehouse, queueWood(), T0);
    expect(failureKey(running, collect(), T0 + 1000)).toBe('error.nothingToCollect');
  });

  it('refuses when there is no Storehouse', () => {
    const noStorehouse = advance(succeed(initial, queueWood(), T0), T0 + MINUTE).state;
    expect(failureKey(noStorehouse, collect(), T0 + MINUTE)).toBe('error.noStorehouse');
  });

  it('refuses when the Materials compartment is full and keeps the output in its Slot', () => {
    const full: GameState = { ...ready, storage: { materials: { wood: 20 }, goods: {} } };
    expect(failureKey(full, collect(), T0 + 5 * MINUTE)).toBe('error.storageFull');
    expect(queueOf(full).filter((entry) => entry.done)).toHaveLength(2);
  });

  it('collects what fits, in queue order, and reports StorageFull for the rest', () => {
    const almostFull: GameState = { ...ready, storage: { materials: { wood: 19 }, goods: {} } };
    const result = dispatch(almostFull, collect(), T0 + 5 * MINUTE);
    if (!result.ok) throw new Error('expected success');
    expect(result.state.storage.materials).toEqual({ wood: 20 });
    expect(queueOf(result.state).map((entry) => entry.item)).toEqual(['stone']);
    expect(result.events).toContainEqual({ type: 'StorageFull', buildingId: WORKSHOP_ID });
  });
});

describe('Storehouse rules', () => {
  it('cannot be sold while it holds stock, and can be sold when empty', () => {
    const queued = succeed(withStorehouse, queueWood(), T0);
    const stocked = succeed(queued, collect(), T0 + MINUTE);
    const storehouse = stocked.buildings.find((b) => b.type === 'storehouse');
    expect(failureKey(stocked, { type: 'SellBuilding', id: storehouse?.id ?? 0 }, T0 + MINUTE)).toBe('error.storageInUse');
    expect(failureKey(withStorehouse, { type: 'SellBuilding', id: storehouse?.id ?? 0 }, T0)).toBeNull();
  });
});

describe('MoveBuilding', () => {
  it('restarts the running production at the time of the move', () => {
    const running = succeed(initial, queueWood(), T0);
    const moved = succeed(running, { type: 'MoveBuilding', id: WORKSHOP_ID, x: 56, y: 59 }, T0 + 30 * SECOND);
    expect(queueOf(moved)[0]?.startedAt).toBe(T0 + 30 * SECOND);
  });

  it('keeps finished output where it is', () => {
    const finished = advance(succeed(initial, queueWood(), T0), T0 + MINUTE).state;
    const moved = succeed(finished, { type: 'MoveBuilding', id: WORKSHOP_ID, x: 56, y: 59 }, T0 + 2 * MINUTE);
    expect(queueOf(moved)[0]).toMatchObject({ done: true });
  });
});

describe('isWorking', () => {
  const workshop = (state: GameState) => state.buildings.find((b) => b.id === WORKSHOP_ID)!;

  it('is false for a building that has nothing to make', () => {
    expect(isWorking(workshop(initial))).toBe(false);
  });

  it('is true while a production is running, and false once it is done', () => {
    const queued = succeed(withStorehouse, queueWood(), T0);
    expect(isWorking(workshop(queued))).toBe(true);
    expect(isWorking(workshop(advance(queued, T0 + 2 * MINUTE).state))).toBe(false);
  });

  it('is true for a Shop that is selling and false once its stack is sold', () => {
    const shop = { ...initial.buildings[0]!, type: 'shop' as const, stacks: [{ good: 'planks' as const, stock: 2, nextSaleAt: T0 + 1000, earned: 0 }] };
    expect(isWorking(shop)).toBe(true);
    expect(isWorking({ ...shop, stacks: [{ good: 'planks' as const, stock: 0, nextSaleAt: null, earned: 28 }] })).toBe(false);
  });
});

describe('workProgress', () => {
  const workshop = (state: GameState) => state.buildings.find((b) => b.id === WORKSHOP_ID)!;

  it('is null when nothing is going on', () => {
    expect(workProgress(workshop(initial), T0)).toBeNull();
  });

  it('follows the running production from 0 to 1', () => {
    const queued = succeed(withStorehouse, queueStone(), T0);
    expect(workProgress(workshop(queued), T0)).toBe(0);
    expect(workProgress(workshop(queued), T0 + MINUTE)).toBeCloseTo(0.5);
    expect(workProgress(workshop(queued), T0 + 5 * MINUTE)).toBe(1);
  });

  it('follows the time to the next sale in a Shop', () => {
    const shop = { ...initial.buildings[0]!, type: 'shop' as const, stacks: [{ good: 'planks' as const, stock: 2, nextSaleAt: T0 + 45 * SECOND, earned: 0 }] };
    expect(workProgress(shop, T0)).toBeCloseTo(0);
    expect(workProgress(shop, T0 + 22.5 * SECOND)).toBeCloseTo(0.5);
  });
});
