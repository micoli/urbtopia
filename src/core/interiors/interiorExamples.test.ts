import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type BuildingType, type GameState } from '../index';
import { interiorLinksOf } from '../factory/factoryInterior';
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

  it.each(types)('%s: every Fixture can be placed in the room, and the set-up runs', type => {
    const building = fitted(type).buildings.find(candidate => candidate.id === 1) as Building;
    const fixtures = building.interior!.fixtures;
    expect(fixtures).toHaveLength(INTERIOR_EXAMPLES[type]!.fixtures.length);
    const { linked, lined } = interiorLinksOf(fixtures);
    expect(linked.size + lined.size).toBeGreaterThan(0);
  });
});
