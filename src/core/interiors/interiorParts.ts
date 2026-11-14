import { congestionStats } from '../traffic/congestion';
import { jobsOf } from '../traffic/jobs';
import { isAdapting } from '../environment/adaptation';
import type { Building, GameState, InteriorRole } from '../engine/state';
import { interiorDeclarationOf, interiorRoleShare, totalInteriorStaff, type InteriorPart } from './interiorStaff';

// The share of the Jobs of a building that Citizens fill on the Commute; a building with no interior Staff is complete.
export function interiorFillRate(state: GameState, building: Building): number {
  if (totalInteriorStaff(building) === 0 || isAdapting(state)) return 1;
  const offered = jobsOf(building);
  if (offered === 0) return 1;
  return Math.min(1, (congestionStats(state).filledJobs.get(building.id) ?? 0) / offered);
}

// The parts of the effect of an interior that its Staff deliver. A part no role carries, or whose role is not hired, is 0: it adds nothing and never takes away what the building did before.
export function interiorPartsOf(state: GameState, building: Building): Partial<Record<InteriorPart, number>> {
  const declaration = interiorDeclarationOf(building.type);
  if (!declaration) return {};
  const fillRate = interiorFillRate(state, building);
  const parts: Partial<Record<InteriorPart, number>> = {};
  for (const [role, { part }] of Object.entries(declaration.roles) as [InteriorRole, { part: InteriorPart }][]) parts[part] = interiorRoleShare(building, role, fillRate);
  return parts;
}
