import { describe, expect, it } from 'vitest';
import { dispatch, newGame, type Command, type GameState } from './index';
import { TUTORIAL_STEPS } from './tutorial';

const T0 = 1_700_000_000_000;

function run(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`${command.type}: ${result.error.key}`);
  return result.state;
}

function refusal(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

const idOf = (state: GameState, type: string) => state.buildings.find((building) => building.type === type)?.id ?? 0;
const place = (buildingType: 'workshop' | 'factory' | 'storehouse' | 'shop' | 'home' | 'powerPlant' | 'waterTower', x: number, y: number): Command => ({
  type: 'PlaceBuilding',
  buildingType,
  x,
  y,
});
const queue = (buildingId: number, item: string): Command => ({ type: 'QueueProduction', buildingId, item });
const road: Command = { type: 'BuildRoad', from: { x: 53, y: 58 }, to: { x: 62, y: 58 } };

const fresh = newGame({ seed: 'amber-fox-4821', now: T0, tutorial: true });

function produce(state: GameState, buildingType: 'workshop' | 'factory', item: string, count: number): GameState {
  const id = idOf(state, buildingType);
  let current = state;
  for (let index = 0; index < count; index++) current = run(current, queue(id, item));
  return run(run(current, { type: 'SkipTutorialStep' }), { type: 'Collect', buildingId: id });
}

function upToStep(target: (typeof TUTORIAL_STEPS)[number]): GameState {
  let state = fresh;
  const script: Record<string, (current: GameState) => GameState> = {
    road: (current) => run(current, road),
    workshop: (current) => run(current, place('workshop', 54, 56)),
    factory: (current) => run(current, place('factory', 60, 56)),
    storehouse: (current) => run(current, place('storehouse', 56, 59)),
    wood: (current) => produce(current, 'workshop', 'wood', 2),
    planks: (current) => produce(produce(produce(current, 'factory', 'planks', 2), 'factory', 'planks', 2), 'factory', 'planks', 1),
    shop: (current) => run(current, place('shop', 57, 57)),
    stock: (current) => run(current, { type: 'StockShop', buildingId: idOf(current, 'shop'), good: 'planks' }),
    sell: (current) => run(current, { type: 'SkipTutorialStep' }),
    utilities: (current) => run(run(current, place('powerPlant', 70, 70)), place('waterTower', 72, 70)),
    home: (current) => run(current, place('home', 58, 57)),
    tax: (current) => run(current, { type: 'SkipTutorialStep' }),
  };
  for (const step of TUTORIAL_STEPS) {
    if (step === target) return state;
    state = script[step]?.(state) ?? state;
  }
  return state;
}

describe('Tutorial start', () => {
  it('begins on an empty map with enough Urbs and the first step', () => {
    expect(fresh.buildings).toEqual([]);
    expect(fresh.roads).toEqual([]);
    expect(fresh.tutorial).toBe('road');
    expect(fresh.urbs).toBeGreaterThanOrEqual(1700);
  });

  it('is off by default', () => {
    expect(newGame({ seed: 'amber-fox-4821', now: T0 }).tutorial).toBeNull();
  });
});

describe('Tutorial steps', () => {
  it('advances through every step and ends with the game free', () => {
    const steps = TUTORIAL_STEPS.map((step) => upToStep(step).tutorial);
    expect(steps).toEqual([...TUTORIAL_STEPS]);
    expect(run(upToStep('tax'), { type: 'SkipTutorialStep' }).tutorial).toBeNull();
  });

  it('keeps the Urbs sufficient to complete the whole sequence', () => {
    const finished = run(upToStep('tax'), { type: 'SkipTutorialStep' });
    expect(finished.urbs).toBeGreaterThanOrEqual(0);
  });
});

describe('Tutorial locks', () => {
  it('refuses a building that does not match the current step', () => {
    expect(refusal(upToStep('workshop'), place('factory', 60, 56))).toBe('error.tutorialLocked');
  });

  it('refuses demolition and selling while running', () => {
    const state = upToStep('factory');
    expect(refusal(state, { type: 'DemolishRoad', x: 53, y: 58 })).toBe('error.tutorialLocked');
    expect(refusal(state, { type: 'SellBuilding', id: idOf(state, 'workshop') })).toBe('error.tutorialLocked');
  });

  it('refuses a production other than the one asked', () => {
    const state = upToStep('wood');
    expect(refusal(state, queue(idOf(state, 'workshop'), 'stone'))).toBe('error.tutorialLocked');
  });

  it('allows moving a building and extending the road at any step', () => {
    const state = upToStep('factory');
    const moved = dispatch(state, { type: 'MoveBuilding', id: idOf(state, 'workshop'), x: 55, y: 56 }, T0);
    expect(moved.ok).toBe(true);
    expect(refusal(state, { type: 'BuildRoad', from: { x: 62, y: 58 }, to: { x: 64, y: 58 } })).toBeNull();
  });

  it('does not lock anything once the tutorial is over', () => {
    const finished = run(upToStep('tax'), { type: 'SkipTutorialStep' });
    expect(refusal(finished, { type: 'SellBuilding', id: idOf(finished, 'home') })).toBeNull();
  });
});

describe('Tutorial time skip', () => {
  it('has nothing to skip on a step that does not wait', () => {
    expect(refusal(upToStep('workshop'), { type: 'SkipTutorialStep' })).toBe('error.nothingToSkip');
  });

  it('completes the queued production exactly, no more', () => {
    const state = upToStep('wood');
    const queued = run(run(state, queue(idOf(state, 'workshop'), 'wood')), queue(idOf(state, 'workshop'), 'wood'));
    const skipped = run(queued, { type: 'SkipTutorialStep' });
    expect(skipped.buildings.find((building) => building.type === 'workshop')?.queue.map((entry) => entry.done)).toEqual([true, true]);
    expect(skipped.lastSeen).toBe(T0);
  });
});

describe('Skipping the tutorial', () => {
  it('gives the legacy start when nothing was built', () => {
    const skipped = run(fresh, { type: 'SkipTutorial' });
    const legacy = newGame({ seed: 'amber-fox-4821', now: T0 });
    expect(skipped).toEqual(legacy);
  });

  it('keeps the city as it is when already underway', () => {
    const state = upToStep('factory');
    const skipped = run(state, { type: 'SkipTutorial' });
    expect(skipped.tutorial).toBeNull();
    expect(skipped.buildings).toEqual(state.buildings);
    expect(skipped.urbs).toBe(state.urbs);
  });
});
