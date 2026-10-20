import { advance, newGame, POLITICS, type Difficulty, type GameState } from '../index';
import { createBuilding } from '../buildings/buildingSpecs';

export const DAY = POLITICS.dayHours * 3_600_000;
// An hour past a game day boundary, so the tests count whole days from there.
export const T0 = Math.ceil(1_700_000_000_000 / DAY) * DAY + 3_600_000;

const BIGGEST_HOME_TIER = 8;

// A city with a Town hall, a large Home and enough Urbs to pay upkeep, with its politics started.
export function politicalCity(difficulty: Difficulty = 'easy'): GameState {
  const city = newGame({ seed: 'amber-fox-4821', now: T0, difficulty });
  const home = { ...createBuilding(city.nextId + 1, 'home', 4, 4, 0), tier: BIGGEST_HOME_TIER };
  const withHall = { ...city, urbs: 10_000, nextId: city.nextId + 2, buildings: [...city.buildings, createBuilding(city.nextId, 'townHall', 8, 8, 0), home] };
  return advance(withHall, T0).state;
}

export const withApproval = (state: GameState, approval: number, shock = 0): GameState => ({ ...state, politics: { ...state.politics!, approval, shock } });
