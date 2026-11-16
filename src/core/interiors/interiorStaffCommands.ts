import type { CommandOutcome } from '../engine/commands';
import type { Building, GameState, InteriorData, InteriorRole } from '../engine/state';
import { VENUE } from '../venues/shared';
import { hireFeeOf } from '../venues/staff';
import { withAssignmentsCovered } from './interiorAssignments';
import { editInterior } from './interiorEdit';
import { hiredInteriorOf, interiorPostsOfBuilding, interiorRolesOf, interiorWagesPerHour } from './interiorStaff';

const declaresRole = (role: InteriorRole) => (building: Building): boolean => interiorRolesOf(building.type).includes(role);

const staffWith = (interior: InteriorData, role: InteriorRole, count: number): InteriorData['staff'] => {
  const staff = { ...interior.staff };
  if (count > 0) staff[role] = count;
  else delete staff[role];
  return staff;
};

export const hireInteriorStaff = (state: GameState, buildingId: number, role: InteriorRole): CommandOutcome =>
  editInterior(state, buildingId, declaresRole(role), (building, interior) => {
    const posts = interiorPostsOfBuilding(building, role);
    if (posts === 0) return { key: 'error.tierTooLow' };
    const hired = hiredInteriorOf(interior, role);
    if (hired >= posts) return { key: 'error.noStaffPost' };
    return { interior: { ...interior, staff: staffWith(interior, role, hired + 1) }, urbs: -hireFeeOf(role) };
  });

export const releaseInteriorStaff = (state: GameState, buildingId: number, role: InteriorRole): CommandOutcome =>
  editInterior(state, buildingId, declaresRole(role), (building, interior) => {
    const hired = hiredInteriorOf(interior, role);
    if (hired === 0) return { key: 'error.noStaffToRelease' };
    const released = { ...interior, staff: staffWith(interior, role, hired - 1) };
    return { interior: { ...released, fixtures: withAssignmentsCovered({ ...building, interior: released }, role, hired - 1) } };
  });

// The Staff hired in an interior are paid by the hour, as far as the city's Urbs go.
export function payInteriorStaff(state: GameState, from: number, to: number): GameState {
  if (to <= from || !state.buildings.some(building => interiorWagesPerHour(building) > 0)) return state;
  const hours = (to - from) / VENUE.hourMs;
  const owed = state.buildings.reduce((total, building) => total + interiorWagesPerHour(building) * hours, 0);
  return { ...state, urbs: state.urbs - Math.min(state.urbs, owed) };
}
