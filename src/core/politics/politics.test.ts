import { describe, expect, it } from 'vitest';
import { advance, dispatch, isPoliticsActive, newGame, type Difficulty, type GameState } from '../index';
import { createBuilding } from '../buildings/buildingSpecs';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;

function cityWithTownHall(difficulty: Difficulty): GameState {
  const city = newGame({ seed: 'amber-fox-4821', now: T0, difficulty });
  return { ...city, nextId: city.nextId + 1, buildings: [...city.buildings, createBuilding(city.nextId, 'townHall', 8, 8, 0)] };
}

describe('Politics activation', () => {
  it('is off in a new game', () => {
    const city = newGame({ seed: 'amber-fox-4821', now: T0 });
    expect(isPoliticsActive(city)).toBe(false);
    expect(advance(city, T0 + HOUR).state.politics).toBeUndefined();
  });

  it('is off under Cozy even with a Town hall', () => {
    const city = cityWithTownHall('cozy');
    expect(isPoliticsActive(city)).toBe(false);
    expect(advance(city, T0 + HOUR).state.politics).toBeUndefined();
  });

  it.each(['easy', 'medium', 'hard'] as const)('is off under %s without a Town hall', (difficulty) => {
    const city = newGame({ seed: 'amber-fox-4821', now: T0, difficulty });
    expect(city.buildings.some(b => b.type === 'townHall')).toBe(false);
    expect(advance(city, T0 + HOUR).state.politics).toBeUndefined();
  });

  it.each(['easy', 'medium', 'hard'] as const)('starts under %s once a Town hall is built, from the Seed', (difficulty) => {
    const city = cityWithTownHall(difficulty);
    const first = advance(city, T0 + HOUR).state;
    expect(isPoliticsActive(first)).toBe(true);
    expect(first.politics).toBeDefined();
    expect(advance(city, T0 + HOUR).state.politics).toEqual(first.politics);
  });

  it('keeps the block unchanged once it exists', () => {
    const started = advance(cityWithTownHall('easy'), T0 + HOUR).state;
    expect(advance(started, T0 + HOUR * 1.2).state.politics).toEqual(started.politics);
  });

  it('does not use the main random stream of the game', () => {
    const started = advance(cityWithTownHall('easy'), T0 + HOUR).state;
    expect(started.politics!.rngState).not.toBe(started.rngState);
  });

  it('starts when the Difficulty is raised from Cozy', () => {
    const cozy = cityWithTownHall('cozy');
    const result = dispatch(cozy, { type: 'SetDifficulty', difficulty: 'easy' }, T0);
    if (!result.ok) throw new Error(result.error.key);
    expect(advance(result.state, T0 + HOUR).state.politics).toBeDefined();
  });
});
