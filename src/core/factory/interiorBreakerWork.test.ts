import { describe, expect, it } from 'vitest';
import { advance, assignedRoleOf, createBuilding, dispatch, focusGoodsOf, hasAssignments, INTERIOR_EXAMPLES, newGame, type Building, type BuildingType, type Command, type GameState, type GoodId, type InteriorRole } from '../index';
import { advanceAssistants } from './assistants';
import { picksItem } from '../interiors/interiorAssignments';
import { recipeOf } from '../economy/items';

const HOUR = 3_600_000;
const STEP = 60_000;
const STOCK = 1_000;

const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(`${command.type}: ${result.error.key}`);
  return result.state;
};
const host = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;

// Every Production interior whose Staff work on their own: read from the layouts, so a new interior is covered without touching this file.
const workingTypes = (Object.keys(INTERIOR_EXAMPLES) as BuildingType[]).filter(type => hasAssignments({ type }));

// A city with the interior fitted as its example shows, a Storehouse full of what the Recipes take, and every assignable Fixture given a Good and a Staff.
const staffedCity = (type: BuildingType): GameState => {
  const example = INTERIOR_EXAMPLES[type]!;
  const base: GameState = {
    ...newGame({ seed: `breaker-work-${type}`, now: 0 }), nextId: 100, urbs: 1_000_000, tutorial: null, adaptationUntil: 100 * HOUR, lastSeen: 0,
    buildings: [...homes, { ...createBuilding(1, type, 55, 50, 0), tier: Math.max(example.tier, 5) }, { ...createBuilding(2, 'storehouse', 70, 50, 0), tier: 5 }],
  };
  const fitted = example.fixtures.reduce((state, fixture) => send(state, { type: 'PlaceInteriorFixture', buildingId: 1, fixture: fixture.type, x: fixture.x, y: fixture.y, rotation: fixture.rotation }), base);
  const goods = host(fitted).interior!.fixtures.flatMap(fixture => focusGoodsOf(host(fitted), fixture)) as GoodId[];
  const stocked: GameState = { ...fitted, storage: { ...fitted.storage, goods: { ...fitted.storage.goods }, materials: { ...fitted.storage.materials } } };
  for (const good of new Set(goods)) {
    (stocked.storage.goods as Record<string, number>)[good] = STOCK;
    for (const [material, amount] of Object.entries(recipeOf(good))) (stocked.storage.materials as Record<string, number>)[material] = (amount ?? 0) * STOCK;
  }
  const workers = host(stocked).interior!.fixtures.filter(fixture => assignedRoleOf(fixture) !== undefined || picksItem(fixture));
  const roles = new Set(workers.map(assignedRoleOf).filter((role): role is InteriorRole => role !== undefined));
  const hired = [...roles].reduce((state, role) => workers.filter(fixture => assignedRoleOf(fixture) === role).reduce(current => send(current, { type: 'HireInteriorStaff', buildingId: 1, role }), state), stocked);
  // Machines and Extractors first: a Display counter only offers what the Machines upstream make.
  const ordered = [...workers].sort((a, b) => Number(assignedRoleOf(a) === 'seller') - Number(assignedRoleOf(b) === 'seller'));
  return ordered.reduce((state, worker) => {
    const current = host(state).interior!.fixtures.find(fixture => fixture.id === worker.id)!;
    const [good] = focusGoodsOf(host(state), current);
    const focused = good === undefined ? state : send(state, { type: 'SetInteriorFocus', buildingId: 1, fixtureId: worker.id, good });
    return picksItem(worker) ? focused : send(focused, { type: 'AssignInteriorStaff', buildingId: 1, fixtureId: worker.id });
  }, hired);
};

const run = (state: GameState, ms: number): GameState => {
  let current = state;
  for (let at = STEP; at <= ms; at += STEP) current = advance(current, at).state;
  return current;
};

// What the Staff change when they work: the Storehouse, the Slots queue and the Counter stacks.
const outputOf = (state: GameState): string => JSON.stringify({ storage: state.storage, queue: host(state).queue, stacks: host(state).stacks });

describe('the Staff of every Production interior with assigned Staff', () => {
  it('is read from the layouts', () => {
    expect(workingTypes.length).toBeGreaterThan(0);
  });

  describe.each(workingTypes)('%s', type => {
    it('works on its own while the breaker is on', () => {
      const state = staffedCity(type);
      expect(outputOf(run(state, 8 * HOUR))).not.toBe(outputOf(state));
    });

    it.each([0, 0.01])('does no automatic work with %s Urbs, then resumes when funded', urbs => {
      const poor = { ...staffedCity(type), urbs };
      const stopped = advanceAssistants(poor, HOUR).state;
      expect(outputOf(stopped)).toBe(outputOf(poor));
      const funded = { ...stopped, urbs: 100_000 };
      expect(outputOf(advanceAssistants(funded, HOUR).state)).not.toBe(outputOf(funded));
    });

    it('does nothing while the breaker is off', () => {
      const off = send(staffedCity(type), { type: 'SetInteriorBreaker', buildingId: 1, off: true });
      expect(outputOf(run(off, 8 * HOUR))).toBe(outputOf(off));
    });

    it('keeps paying the wages while the breaker is off', () => {
      const off = send(staffedCity(type), { type: 'SetInteriorBreaker', buildingId: 1, off: true });
      expect(run(off, 8 * HOUR).urbs).toBeLessThan(off.urbs);
    });
  });
});
