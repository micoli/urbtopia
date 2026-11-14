import { describe, expect, it } from 'vitest';
import { FIXTURE_CATEGORIES, advance, assignedFixturesOf, carriedItemOf, createBuilding, dispatch, focusGoodsOf, interiorLinksOf, linePathsOf, newGame, type Building, type Command, type FixtureId, type GameState, type GoodId, type Rotation } from '../index';
import { PRODUCTION_INTERIOR_KINDS } from '../venues/venueVocabulary';
import { interiorExampleOf } from '../interiors/interiorExamples';
import { checkGameState } from '../../persistence/validate';

const HOUR = 3_600_000;
const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
const city = (): GameState => ({
  ...newGame({ seed: 'workshop-interior', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 100 * HOUR, lastSeen: 0,
  buildings: [...homes, createBuilding(1, 'workshop', 55, 50, 0), createBuilding(2, 'storehouse', 70, 50, 0)],
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
const apply = (state: GameState, ...commands: Command[]) => commands.reduce(send, state);
const workshop = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceInteriorFixture', buildingId: 1, fixture, x, y, rotation });
const idOf = (state: GameState, type: FixtureId): number => workshop(state).interior!.fixtures.find(fixture => fixture.type === type)!.id;
const example = interiorExampleOf('workshop')!;
const fitted = (): GameState => apply(city(), ...example.fixtures.map(piece => place(piece.type, piece.x, piece.y, piece.rotation)));

describe('the build menu of the Production interiors', () => {
  it('has sections for every kind of interior, the Workshop included', () => {
    for (const kind of PRODUCTION_INTERIOR_KINDS) expect(FIXTURE_CATEGORIES[kind]?.length, kind).toBeGreaterThan(0);
  });
});

describe('the Workshop interior', () => {
  it('links the Extractor, the Cleaner and the Storage bin of the example into one Line', () => {
    const state = fitted();
    const { lined, linked } = interiorLinksOf(workshop(state).interior!.fixtures);
    for (const type of ['workshopExtractorRight', 'workshopCleanerRight', 'workshopBin'] as const) expect(lined.has(idOf(state, type))).toBe(true);
    expect(linked.has(idOf(state, 'workshopExtractorRight'))).toBe(true);
  });

  it('keeps the Extractor against the back wall', () => {
    expect(failure(city(), place('workshopExtractor', 2, 2))).toBe('error.tilesOccupied');
  });

  it('picks the item on the Extractor and restocks it on the bin', () => {
    const state = fitted();
    const extractor = idOf(state, 'workshopExtractorRight');
    expect(focusGoodsOf(workshop(state), workshop(state).interior!.fixtures.find(fixture => fixture.id === extractor)!).length).toBeGreaterThan(0);
    const picked = apply(state, { type: 'SetInteriorFocus', buildingId: 1, fixtureId: extractor, good: 'wood' as GoodId });
    expect(carriedItemOf(workshop(picked).interior!.fixtures, workshop(picked).interior!.fixtures.find(fixture => fixture.type === 'workshopBin')!)).toBe('wood');
  });

  it('assigns a restocker to the bin only once an item reaches it', () => {
    const state = apply(fitted(), { type: 'HireInteriorStaff', buildingId: 1, role: 'restocker' });
    const bin = idOf(state, 'workshopBin');
    expect(failure(state, { type: 'AssignInteriorStaff', buildingId: 1, fixtureId: bin })).toBe('error.noFocus');
    const picked = apply(state, { type: 'SetInteriorFocus', buildingId: 1, fixtureId: idOf(state, 'workshopExtractorRight'), good: 'wood' as GoodId }, { type: 'AssignInteriorStaff', buildingId: 1, fixtureId: bin });
    expect(assignedFixturesOf(workshop(picked).interior, 'restocker').map(fixture => fixture.id)).toEqual([bin]);
  });

  it('runs the queue and stores the material by itself, with no bonus', () => {
    const state = fitted();
    const bin = idOf(state, 'workshopBin');
    const working = apply(state, { type: 'HireInteriorStaff', buildingId: 1, role: 'restocker' }, { type: 'SetInteriorFocus', buildingId: 1, fixtureId: idOf(state, 'workshopExtractorRight'), good: 'wood' as GoodId }, { type: 'AssignInteriorStaff', buildingId: 1, fixtureId: bin });
    const later = advance(working, 6 * HOUR).state;
    expect(later.storage.materials.wood ?? 0).toBeGreaterThan(working.storage.materials.wood ?? 0);
    expect(checkGameState(later).ok).toBe(true);
  });
});

describe('the items on the Line of a Workshop', () => {
  it('are the item picked on the Extractor, from its mouth to the bin', () => {
    const state = fitted();
    const unpicked = linePathsOf(workshop(state).interior!.fixtures);
    expect(unpicked.length).toBeGreaterThan(0);
    for (const path of unpicked) expect(path.baked).toBeUndefined();
    const picked = apply(state, { type: 'SetInteriorFocus', buildingId: 1, fixtureId: idOf(state, 'workshopExtractorRight'), good: 'wood' as GoodId });
    for (const path of linePathsOf(workshop(picked).interior!.fixtures)) expect(path.baked).toEqual({ from: 0, good: 'wood' });
  });
});
