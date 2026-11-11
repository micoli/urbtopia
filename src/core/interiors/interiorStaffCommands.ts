import type { CommandOutcome } from '../engine/commands';
import type { Building, GameState, InteriorData, InteriorRole } from '../engine/state';
import { VENUE } from '../venues/shared';
import { hireFeeOf } from '../venues/staff';
import { hiredInteriorOf, interiorPostsOf, interiorRolesOf, interiorWagesPerHour } from './interiorStaff';

const EMPTY_INTERIOR: InteriorData = { fixtures: [], nextFixtureId: 1 };

const hostOf = (state: GameState, buildingId: number, role: InteriorRole): Building | undefined => {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  return building && interiorRolesOf(building.type).includes(role) ? building : undefined;
};

const withStaff = (state: GameState, building: Building, staff: InteriorData['staff'], urbs = state.urbs): GameState => ({
  ...state,
  urbs,
  buildings: state.buildings.map(candidate => (candidate === building ? { ...building, interior: { ...(building.interior ?? EMPTY_INTERIOR), staff } } : candidate)),
});

const staffWith = (building: Building, role: InteriorRole, count: number): InteriorData['staff'] => {
  const staff = { ...building.interior?.staff };
  if (count > 0) staff[role] = count;
  else delete staff[role];
  return staff;
};

export function hireInteriorStaff(state: GameState, buildingId: number, role: InteriorRole): CommandOutcome {
  const building = hostOf(state, buildingId, role);
  if (!building) return { key: 'error.unknownBuilding' };
  const posts = interiorPostsOf(building.type, role, building.tier);
  if (posts === 0) return { key: 'error.tierTooLow' };
  const hired = hiredInteriorOf(building.interior, role);
  if (hired >= posts) return { key: 'error.noStaffPost' };
  const fee = hireFeeOf(role);
  if (state.urbs < fee) return { key: 'error.notEnoughUrbs' };
  return { state: withStaff(state, building, staffWith(building, role, hired + 1), state.urbs - fee), events: [] };
}

export function releaseInteriorStaff(state: GameState, buildingId: number, role: InteriorRole): CommandOutcome {
  const building = hostOf(state, buildingId, role);
  if (!building) return { key: 'error.unknownBuilding' };
  const hired = hiredInteriorOf(building.interior, role);
  if (hired === 0) return { key: 'error.noStaffToRelease' };
  return { state: withStaff(state, building, staffWith(building, role, hired - 1)), events: [] };
}

// The Staff hired in an interior are paid by the hour, as far as the city's Urbs go.
export function payInteriorStaff(state: GameState, from: number, to: number): GameState {
  if (to <= from || !state.buildings.some(building => interiorWagesPerHour(building) > 0)) return state;
  const hours = (to - from) / VENUE.hourMs;
  const owed = state.buildings.reduce((total, building) => total + interiorWagesPerHour(building) * hours, 0);
  return { ...state, urbs: state.urbs - Math.min(state.urbs, owed) };
}
