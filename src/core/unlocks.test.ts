import { describe, expect, it } from 'vitest';
import { dispatch, isItemUnlocked, newGame, nextUnlock, type Command, type GameState } from './index';

const T0 = 1_700_000_000_000;
const initial = newGame({ seed: 'amber-fox-4821', now: T0 });

function withCitizens(citizens: number): GameState {
  const homes = Array.from({ length: citizens / 6 }, (_, index) => ({
    id: 100 + index,
    type: 'home' as const,
    x: 40 + index,
    y: 40,
    rotation: 0 as const,
    slotCount: 0,
    queue: [],
    stacks: [],
    tier: 1,
    taxCitizenMs: 0,
  }));
  return { ...initial, buildings: [...initial.buildings, ...homes] };
}

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

describe('isItemUnlocked', () => {
  it('opens Wood, Stone, Planks and Bricks from the start', () => {
    for (const item of ['wood', 'stone', 'planks', 'bricks'] as const) expect(isItemUnlocked(initial, item)).toBe(true);
  });

  it.each([
    [24, 'clay', false],
    [30, 'clay', true],
    [30, 'tiles', true],
    [78, 'metal', false],
    [84, 'metal', true],
    [84, 'tools', true],
    [198, 'silicon', false],
    [204, 'silicon', true],
    [204, 'glass', true],
    [204, 'circuits', true],
  ] as const)('with %d Citizens, %s is unlocked: %s', (citizens, item, expected) => {
    expect(isItemUnlocked(withCitizens(citizens), item)).toBe(expected);
  });
});

describe('queueing locked items', () => {
  it('refuses a locked Material in a Workshop', () => {
    expect(failureKey(initial, { type: 'QueueProduction', buildingId: 1, item: 'clay' })).toBe('error.itemLocked');
  });

  it('accepts it once the threshold is reached', () => {
    expect(failureKey(withCitizens(36), { type: 'QueueProduction', buildingId: 1, item: 'clay' })).toBeNull();
  });
});

describe('nextUnlock', () => {
  it('names the next threshold and what it opens', () => {
    expect(nextUnlock(withCitizens(18))).toEqual({ citizens: 30, items: ['clay', 'tiles'] });
    expect(nextUnlock(withCitizens(36))).toEqual({ citizens: 80, items: ['metal', 'tools'] });
  });

  it('announces the late-game items after 200 Citizens', () => {
    expect(nextUnlock(withCitizens(204))).toEqual({ citizens: 350, items: ['sand', 'cement'] });
    expect(nextUnlock(withCitizens(354))).toEqual({ citizens: 600, items: ['coal', 'steel'] });
    expect(nextUnlock(withCitizens(606))).toEqual({ citizens: 1000, items: ['gold', 'jewelry', 'crystal'] });
  });

  it('returns null once everything is unlocked', () => {
    expect(nextUnlock(withCitizens(1008))).toBeNull();
  });
});
