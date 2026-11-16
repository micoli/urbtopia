import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type BuildingType, type GameState, type VenueFixture } from '../index';
import { interiorLinksOf } from '../factory/interiorLinks';
import { FIXTURES } from '../venues/fixtures';
import { INTERIOR_EXAMPLES } from './interiorExamples';

const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));

const fitted = (type: BuildingType): GameState => {
  const { tier, fixtures } = INTERIOR_EXAMPLES[type]!;
  const base = createBuilding(1, type, 55, 50, 0);
  const state: GameState = { ...newGame({ seed: 'interior-examples', now: 0 }), nextId: 100, urbs: 10_000_000, tutorial: null, buildings: [...homes, { ...base, tier, slotCount: 5, stacks: [...base.stacks, base.stacks[0]!] }] };
  return fixtures.reduce((current, fixture) => {
    const result = dispatch(current, { type: 'PlaceInteriorFixture', buildingId: 1, fixture: fixture.type, x: fixture.x, y: fixture.y, rotation: fixture.rotation }, 0);
    if (!result.ok) throw new Error(`${type} ${fixture.type} at ${fixture.x},${fixture.y}: ${result.error.key}`);
    return result.state;
  }, state);
};

describe('the examples of set-ups of the Production interiors', () => {
  const types = Object.keys(INTERIOR_EXAMPLES) as BuildingType[];

  it.each(types)('%s: every Fixture can be placed in the room, and the whole set-up runs', type => {
    const building = fitted(type).buildings.find(candidate => candidate.id === 1) as Building;
    const fixtures = building.interior!.fixtures;
    expect(fixtures).toHaveLength(INTERIOR_EXAMPLES[type]!.fixtures.length);
    const { linked, lined, problems } = interiorLinksOf(fixtures);
    const withRole = (role: string) => fixtures.filter(fixture => FIXTURES[fixture.type].role === role);
    expect(withRole('machine').filter(machine => !linked.has(machine.id))).toEqual([]);
    expect(withRole('exit').filter(exit => !lined.has(exit.id))).toEqual([]);
    expect(problems.size).toBe(0);
  });

  it.each(types)('%s: no Fixture can be taken away without stopping a Machine or a Line', type => {
    const all = (fitted(type).buildings.find(candidate => candidate.id === 1) as Building).interior!.fixtures;
    const countOf = (list: readonly VenueFixture[], role: string) => list.filter(fixture => FIXTURES[fixture.type].role === role).length;
    const works = (list: readonly VenueFixture[]) => {
      const { linked, lined } = interiorLinksOf(list);
      const withRole = (role: string) => list.filter(fixture => FIXTURES[fixture.type].role === role);
      return countOf(list, 'machine') === countOf(all, 'machine') && countOf(list, 'exit') === countOf(all, 'exit')
        && withRole('machine').every(machine => linked.has(machine.id)) && withRole('exit').every(exit => lined.has(exit.id));
    };
    const spare = all.filter(fixture => works(all.filter(other => other.id !== fixture.id)));
    expect(spare.map(fixture => fixture.type)).toEqual([]);
  });
});
