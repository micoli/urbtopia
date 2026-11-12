import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, interiorKindOf, newGame, serviceFurnitureQuality, type Building, type Command, type FixtureId, type GameState, type Rotation } from '../index';
import { homeKnowledge } from '../services/knowledge';

// A Library at (55, 50) with a Home beside it, and enough Citizens elsewhere for the interior to open.
const city = (tier = 3, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'library-interior', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  adaptationUntil: 0,
  buildings: [{ ...createBuilding(1, 'library', 55, 50, 0), tier }, { ...createBuilding(10, 'home', 58, 50, 0), tier: 6 },
    ...[11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 20 + id, 20, 0), tier: 6 }))],
});
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  return result.ok ? null : result.error.key;
};
const library = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const apply = (state: GameState, ...commands: Command[]) => commands.reduce(send, state);
const librarian: Command = { type: 'HireInteriorStaff', buildingId: 1, role: 'librarian' };
const furnished = [place('libraryBookshelf', 0, 0), place('libraryBookshelf', 1, 0), place('libraryReadingTable', 2, 2), place('libraryChair', 1, 2), place('libraryLendingDesk', 4, 4)];

describe('the Library interior', () => {
  it('is a Service interior of its own kind that takes its own furniture', () => {
    expect(interiorKindOf(library(city()))).toBe('library');
    expect(failure(city(), place('schoolDesk', 1, 1))).toBe('error.unknownCommand');
    expect(library(apply(city(), ...furnished)).interior?.fixtures).toHaveLength(5);
  });

  it('adds quality with its furniture, capped by the Tier', () => {
    expect(serviceFurnitureQuality(library(city()))).toBe(0);
    expect(serviceFurnitureQuality(library(apply(city(), ...furnished)))).toBeGreaterThan(0);
  });

  it('raises the Knowledge of a Home it serves once furnished and staffed, and not before', () => {
    const home = (state: GameState) => state.buildings.find(candidate => candidate.id === 10)!;
    const bare = city();
    const fitted = apply(city(), ...furnished);
    expect(homeKnowledge(fitted, home(fitted))).toBe(homeKnowledge(bare, home(bare)));
    expect(homeKnowledge(apply(bare, librarian), home(bare))).toBe(homeKnowledge(bare, home(bare)));
    const staffed = apply(fitted, librarian);
    expect(homeKnowledge(staffed, home(staffed))).toBeGreaterThan(homeKnowledge(bare, home(bare)));
  });
});
