import type { CommandOutcome } from '../engine/commands';
import type { Building, GameState, InteriorData, InteriorRole, VenueFixture } from '../engine/state';
import { producibleItems, type GoodId } from '../economy/items';
import { sellableGoodsOf } from '../economy/shops';
import { isItemUnlocked } from '../progression/unlocks';
import { FIXTURES } from '../venues/fixtures';
import { interiorUpstreamOf, suppliedGoodsOf } from '../factory/factoryInterior';
import { hiredInteriorOf, interiorLayoutOf, isProducerRole, yieldGroupOf } from './interiorStaff';

const EMPTY_INTERIOR: InteriorData = { fixtures: [], nextFixtureId: 1 };

export const hasAssignments = (building: Pick<Building, 'type'>): boolean => interiorLayoutOf(building.type)?.assignments === true || interiorLayoutOf(building.type)?.autoWork === true;

// The group of Goods of the Dairy that a role makes, when it makes only one.
const GROUP_OF_ROLE: Partial<Record<InteriorRole, string>> = { cheesemaker: 'cheese', creamMaker: 'cream' };

export const assignedRoleOf = (fixture: Pick<VenueFixture, 'type'>): InteriorRole | undefined => FIXTURES[fixture.type].assigns;

// The Good an assigned Fixture works on: the Recipe of an Oven, the Sold Good of a Display counter.
export const focusOf = (fixture: VenueFixture): GoodId | undefined => (isProducerRole(assignedRoleOf(fixture)) || FIXTURES[fixture.type].picks === true ? fixture.recipe : fixture.soldGood);

// A Fixture on which the player picks the item that its Line carries: the Extractor of a Workshop.
export const picksItem = (fixture: Pick<VenueFixture, 'type'>): boolean => FIXTURES[fixture.type].picks === true;

// The item a Storage bin restocks: the one picked on the Extractor that feeds it through the Line, the lowest id first.
export const carriedItemOf = (fixtures: readonly VenueFixture[], bin: VenueFixture): GoodId | undefined =>
  interiorUpstreamOf(fixtures, bin.id).filter(fixture => picksItem(fixture) && fixture.recipe !== undefined).sort((a, b) => a.id - b.id)[0]?.recipe;

// What the Staff of a Fixture works on: for a restocker, the item its bin receives; for the others, their own Recipe or Sold Good.
export const workFocusOf = (fixtures: readonly VenueFixture[], fixture: VenueFixture): GoodId | undefined => (assignedRoleOf(fixture) === 'restocker' ? carriedItemOf(fixtures, fixture) : focusOf(fixture));

// The Goods the player can choose on a Fixture: those the building produces for a Machine, those its Counter sells for a Display counter, already unlocked.
// A Display counter only sells what the Ovens upstream of it bake.
export function focusGoodsOf(building: Building, fixture: VenueFixture): readonly GoodId[] {
  const role = assignedRoleOf(fixture);
  if (picksItem(fixture)) return (producibleItems(building.type) as GoodId[]);
  if (role === undefined || role === 'restocker') return [];
  if (isProducerRole(role)) {
    const group = GROUP_OF_ROLE[role!];
    return (producibleItems(building.type) as GoodId[]).filter(good => group === undefined || yieldGroupOf(building.type, good) === group);
  }
  const supplied = suppliedGoodsOf(building.interior?.fixtures ?? [], fixture);
  return sellableGoodsOf(building as Parameters<typeof sellableGoodsOf>[0]).filter(good => supplied.has(good));
}

export const assignedFixturesOf = (interior: InteriorData | undefined, role: InteriorRole): VenueFixture[] =>
  (interior?.fixtures ?? []).filter(fixture => fixture.assigned === true && assignedRoleOf(fixture) === role);

export const freeStaffOf = (building: Building, role: InteriorRole): number => hiredInteriorOf(building.interior, role) - assignedFixturesOf(building.interior, role).length;

const without = (fixture: VenueFixture, field: keyof VenueFixture): VenueFixture => Object.fromEntries(Object.entries(fixture).filter(([name]) => name !== field)) as unknown as VenueFixture;

export const withoutAssignment = (fixture: VenueFixture): VenueFixture => without(fixture, 'assigned');

const hostOf = (state: GameState, buildingId: number): Building | undefined => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  return building && hasAssignments(building) ? building : undefined;
};

const assignableOf = (building: Building, fixtureId: number): VenueFixture | undefined => {
  const fixture = building.interior?.fixtures.find(candidate => candidate.id === fixtureId);
  return fixture && (assignedRoleOf(fixture) !== undefined || picksItem(fixture)) ? fixture : undefined;
};

const withFixture = (state: GameState, building: Building, replacement: VenueFixture): CommandOutcome => {
  const interior = building.interior ?? EMPTY_INTERIOR;
  const fixtures = interior.fixtures.map(fixture => (fixture.id === replacement.id ? replacement : fixture));
  return { state: { ...state, buildings: state.buildings.map(candidate => (candidate === building ? { ...building, interior: { ...interior, fixtures } } : candidate)) }, events: [] };
};

export function setInteriorFocus(state: GameState, buildingId: number, fixtureId: number, good: GoodId | null): CommandOutcome {
  const building = hostOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const fixture = assignableOf(building, fixtureId);
  if (!fixture) return { key: 'error.notAssignable' };
  if (assignedRoleOf(fixture) === 'restocker') return { key: 'error.notAssignable' };
  const field = picksItem(fixture) || isProducerRole(assignedRoleOf(fixture)) ? 'recipe' : 'soldGood';
  if (good === null) return withFixture(state, building, without(withoutAssignment(fixture), field));
  if (assignedRoleOf(fixture) === 'seller' && sellableGoodsOf(building as Parameters<typeof sellableGoodsOf>[0]).includes(good) && !focusGoodsOf(building, fixture).includes(good)) return { key: 'error.notUpstream' };
  if (!focusGoodsOf(building, fixture).includes(good)) return { key: 'error.cannotProduce' };
  if (!isItemUnlocked(state, good)) return { key: 'error.itemLocked' };
  return withFixture(state, building, { ...fixture, [field]: good });
}

export function assignInteriorStaff(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const building = hostOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const fixture = assignableOf(building, fixtureId);
  if (!fixture || picksItem(fixture)) return { key: 'error.notAssignable' };
  if (workFocusOf(building.interior?.fixtures ?? [], fixture) === undefined) return { key: 'error.noFocus' };
  if (fixture.assigned) return { key: 'error.staffAlreadyAssigned' };
  if (freeStaffOf(building, assignedRoleOf(fixture)!) <= 0) return { key: 'error.noFreeStaff' };
  return withFixture(state, building, { ...fixture, assigned: true });
}

export function unassignInteriorStaff(state: GameState, buildingId: number, fixtureId: number): CommandOutcome {
  const building = hostOf(state, buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const fixture = assignableOf(building, fixtureId);
  if (!fixture) return { key: 'error.notAssignable' };
  if (!fixture.assigned) return { key: 'error.noStaffAssigned' };
  return withFixture(state, building, withoutAssignment(fixture));
}

// Releasing a Staff leaves a Fixture without it when every hired one was assigned: the last assigned Fixture is freed.
export function withAssignmentsCovered(building: Building, role: InteriorRole, hired: number): InteriorData['fixtures'] {
  const fixtures = building.interior?.fixtures ?? [];
  const assigned = assignedFixturesOf(building.interior, role).sort((a, b) => b.id - a.id);
  const freed = new Set(assigned.slice(0, Math.max(0, assigned.length - hired)));
  return freed.size === 0 ? fixtures : fixtures.map(fixture => (freed.has(fixture) ? withoutAssignment(fixture) : fixture));
}
