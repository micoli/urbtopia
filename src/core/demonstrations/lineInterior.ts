import { createBuilding } from '../buildings/buildingSpecs';
import { newGame } from '../engine/newGame';
import { unpoweredBuildingIds } from '../environment/powered';
import type { Command } from '../engine/commands';
import type { BuildingType, FixtureId, GameState, Rotation } from '../engine/state';
import { assignedFixturesOf, interiorLinksOf, linePathsOf, type GoodId } from '../index';
import { frontHasAccess } from '../map/placement';
import type { DemonstrationStep } from './scenario';

export const BUILDING_ID = 1;

// The homes give the Citizens that open the interior.
export function lineCity(type: BuildingType, seed: string, tier: number): GameState {
  const homes = [10, 11, 12, 13].map(id => ({ ...createBuilding(id, 'home', 40 + id, 30, 0), tier: 6 }));
  return {
    ...newGame({ now: 1_700_000_000_000, seed, tutorial: false, venueTutorials: false }),
    urbs: 50_000,
    buildings: [...homes, { ...createBuilding(BUILDING_ID, type, 60, 56, 2), tier }],
    nextId: 100,
  };
}

export const roomOf = (state: GameState) => {
  const building = state.buildings.find(candidate => candidate.id === BUILDING_ID);
  if (!building) throw new Error('demonstration building missing');
  return building;
};

export const placer = (type: string) => (fixture: string, x: number, y: number, rotation: Rotation): Command =>
  ({ type: 'PlaceInteriorFixture', buildingId: BUILDING_ID, fixture: `${type}${fixture}` as FixtureId, x, y, rotation });

export const remove = (fixtureId: number): Command => ({ type: 'RemoveInteriorFixture', buildingId: BUILDING_ID, fixtureId });

export const hire = (role: 'baker' | 'seller' | 'restocker'): Command => ({ type: 'HireInteriorStaff', buildingId: BUILDING_ID, role });
export const focus = (fixtureId: number, good: GoodId): Command => ({ type: 'SetInteriorFocus', buildingId: BUILDING_ID, fixtureId, good });
export const assign = (fixtureId: number): Command => ({ type: 'AssignInteriorStaff', buildingId: BUILDING_ID, fixtureId });

type StaffRole = 'baker' | 'seller';

export interface LineExpectation {
  count: number;
  // The Machines that receive every Drive and Flow they need.
  linked?: readonly number[];
  // The Fixtures that a Line reaches.
  lined?: readonly number[];
  // The ways that Packets or dough take through the Line.
  paths?: number;
  // The Fixtures that each role of Staff works at.
  staffed?: Partial<Record<StaffRole, readonly number[]>>;
}

const sorted = (ids: Iterable<number>) => [...ids].sort((a, b) => a - b).join(',');

export const checkLine = ({ count, linked = [], lined = [], paths = 0, staffed = {} }: LineExpectation): DemonstrationStep['check'] => state => {
  const building = roomOf(state);
  if (!frontHasAccess(state, building.type, building.x, building.y, building.rotation, building.tier)) throw new Error('demonstration building needs Road access');
  if (unpoweredBuildingIds(state).has(building.id)) throw new Error('demonstration building needs electricity');
  const fixtures = building.interior?.fixtures ?? [];
  if (fixtures.length !== count) throw new Error(`expected ${count} Fixtures, got ${fixtures.length}`);
  const links = interiorLinksOf(fixtures);
  if (sorted(links.linked) !== sorted(linked)) throw new Error(`expected linked Machines ${sorted(linked)}, got ${sorted(links.linked)}`);
  if (sorted(links.lined) !== sorted(lined)) throw new Error(`expected lined Fixtures ${sorted(lined)}, got ${sorted(links.lined)}`);
  const found = linePathsOf(fixtures).length;
  if (found !== paths) throw new Error(`expected ${paths} ways, got ${found}`);
  for (const role of ['baker', 'seller'] as const) {
    const assigned = assignedFixturesOf(building.interior, role).map(fixture => fixture.id);
    if (sorted(assigned) !== sorted(staffed[role] ?? [])) throw new Error(`expected ${role} at ${sorted(staffed[role] ?? [])}, got ${sorted(assigned)}`);
  }
};
