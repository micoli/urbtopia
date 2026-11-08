import { INDUSTRY_TYPES } from '../economy/productionTypes';
import { isOfficeType } from '../economy/offices';
import { isShopType } from '../economy/shops';
import { isFacilityType } from '../services/facilities';
import { isVenueType } from '../venues/profiles';
import { postsAtTier, totalStaff } from '../venues/staff';
import { totalCitizens } from '../buildings/city';
import type { Building, GameState, VenueType } from '../engine/state';
import type { CongestionStats, JobModes } from './congestion';
import { jobsOf, workplaceTypes } from './jobs';

export const JOB_KINDS = ['industry', 'shops', 'offices', 'venues', 'facilities', 'casino'] as const;
export type JobKind = typeof JOB_KINDS[number];

export interface JobsOfKind {
  kind: JobKind;
  offered: number;
  filled: number;
}

export interface VenueStaffRow {
  building: Building;
  hired: number;
  filled: number;
  posts: number;
}

export interface JobsSummary {
  citizens: number;
  offered: number;
  filled: number;
  unfilled: number;
  // Citizens counted Unemployed: they reach a workplace but lose the competition for its Jobs.
  unemployed: number;
  // Citizens with no Job who are not counted Unemployed: their Home reaches no workplace, or has no Road (ADR 0059).
  uncounted: number;
}

export function jobsSummary(state: GameState, congestion: CongestionStats): JobsSummary {
  const citizens = totalCitizens(state);
  const filled = [...congestion.filledJobs.values()].reduce((sum, count) => sum + count, 0);
  const withoutJob = Math.max(0, citizens - filled);
  return {
    citizens,
    offered: congestion.jobs,
    filled,
    unfilled: Math.max(0, congestion.jobs - filled),
    unemployed: congestion.unemployed,
    uncounted: Math.max(0, withoutJob - congestion.unemployed),
  };
}

export function jobKindOf(building: Building): JobKind | null {
  if (building.type === 'casino') return 'casino';
  if ((INDUSTRY_TYPES as readonly string[]).includes(building.type)) return 'industry';
  if (isShopType(building.type)) return 'shops';
  if (isOfficeType(building.type)) return 'offices';
  if (isVenueType(building.type)) return 'venues';
  return isFacilityType(building.type) ? 'facilities' : null;
}

// The Jobs offered and filled by each kind of workplace, the kinds with no Job left out.
export function jobsByKind(state: GameState, congestion: CongestionStats): JobsOfKind[] {
  const totals = new Map<JobKind, JobsOfKind>(JOB_KINDS.map((kind) => [kind, { kind, offered: 0, filled: 0 }]));
  for (const building of state.buildings) {
    const kind = workplaceTypes.includes(building.type) ? jobKindOf(building) : null;
    if (kind === null) continue;
    const total = totals.get(kind)!;
    total.offered += jobsOf(building);
    total.filled += congestion.filledJobs.get(building.id) ?? 0;
  }
  return [...totals.values()].filter(({ offered }) => offered > 0);
}

// The Citizens at work by the way they get there.
export function jobsByMode(congestion: CongestionStats): JobModes {
  const totals: JobModes = { walking: 0, cycling: 0, car: 0, transit: 0 };
  for (const modes of congestion.jobModes.values()) {
    totals.walking += modes.walking;
    totals.cycling += modes.cycling;
    totals.car += modes.car;
    totals.transit += modes.transit;
  }
  return totals;
}

// The Venues with Staff, the least filled first.
export function venueStaffRows(state: GameState, congestion: CongestionStats): VenueStaffRow[] {
  return state.buildings
    .filter((building): building is Building & { venue: NonNullable<Building['venue']> } => isVenueType(building.type) && building.venue !== undefined && totalStaff(building.venue) > 0)
    .map((building) => ({ building, hired: totalStaff(building.venue), filled: congestion.filledJobs.get(building.id) ?? 0, posts: postsAtTier(building.type as VenueType, building.tier) }))
    .sort((a, b) => a.filled / a.hired - b.filled / b.hired || a.building.id - b.building.id);
}
