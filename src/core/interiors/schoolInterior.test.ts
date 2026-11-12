import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, interiorKindOf, interiorSizeOf, isInteriorUnlocked, newGame, serviceFurnitureQuality, serviceQualityOf, type Building, type Command, type FixtureId, type GameState, type Rotation } from '../index';
import { homeKnowledge } from '../services/knowledge';

// A School at (55, 50) with a Home beside it, and enough Citizens elsewhere for the interior to open.
const city = (tier = 3, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'school-interior', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  adaptationUntil: 0,
  buildings: [{ ...createBuilding(1, 'school', 55, 50, 0), tier }, { ...createBuilding(10, 'home', 58, 50, 0), tier: 6 },
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
const school = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const apply = (state: GameState, ...commands: Command[]) => commands.reduce(send, state);
const teacher: Command = { type: 'HireInteriorStaff', buildingId: 1, role: 'teacher' };
const furnished = [place('schoolDesk', 1, 1), place('schoolDesk', 2, 1), place('schoolTeacherDesk', 1, 3), place('schoolGlobe', 3, 3), place('schoolLockers', 4, 0), place('schoolBlackboard', 2, 0)];

describe('the School interior', () => {
  it('is a Service interior of its own kind, with a room that grows with the Tier', () => {
    expect(interiorKindOf(school(city()))).toBe('school');
    expect(interiorSizeOf(school(city(1)))).toBe(5);
    expect(interiorSizeOf(school(city(8)))).toBe(8);
  });

  it('opens once the city has enough Citizens', () => {
    expect(isInteriorUnlocked(city(), 'school')).toBe(true);
    const small = { ...city(), buildings: city().buildings.filter(building => building.id <= 10) };
    expect(failure(small, place('schoolDesk', 1, 1))).toBe('error.itemLocked');
  });

  it('takes the Fixtures of the School, hangs a blackboard on the back wall and refuses the others', () => {
    expect(failure(city(), place('millstone', 1, 1))).toBe('error.unknownCommand');
    expect(failure(city(), place('schoolBlackboard', 2, 2))).toBe('error.tilesOccupied');
    expect(school(apply(city(), ...furnished)).interior?.fixtures).toHaveLength(6);
  });

  it('adds quality with the furniture, capped by the Tier', () => {
    expect(serviceFurnitureQuality(school(city()))).toBe(0);
    const quality = serviceFurnitureQuality(school(apply(city(), ...furnished)));
    expect(quality).toBeGreaterThan(0);
    expect(quality).toBeLessThan(0.26);
  });
});

describe('the Knowledge a School gives', () => {
  const bare = city();
  const fitted = apply(city(), ...furnished);
  const taught = apply(fitted, teacher);
  const home = (state: GameState) => state.buildings.find(candidate => candidate.id === 10)!;

  it('is the same with furniture alone, and with a teacher and nothing to teach with', () => {
    expect(homeKnowledge(fitted, home(fitted))).toBe(homeKnowledge(bare, home(bare)));
    expect(homeKnowledge(apply(bare, teacher), home(bare))).toBe(homeKnowledge(bare, home(bare)));
    expect(serviceQualityOf(fitted, school(fitted), 'schooling')).toBe(0);
  });

  it('rises once the furniture is fitted and a teacher is hired', () => {
    expect(homeKnowledge(taught, home(taught))).toBeGreaterThan(homeKnowledge(bare, home(bare)));
    expect(serviceQualityOf(taught, school(taught), 'schooling', false)).toBeGreaterThan(0);
  });
});
