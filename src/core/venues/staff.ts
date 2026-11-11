import venues from '../../../assets/defs/balance/venues.json' with { type: 'json' };
import { definitionOf, tiersOf } from '../buildings/buildingDefinitions';
import type { StaffRole, VenueData, VenueType } from '../engine/state';
import { VENUE_TYPES } from './profiles';

export const STAFF_ROLES_BY_VENUE = Object.fromEntries(VENUE_TYPES.map(type => [type, definitionOf(type).staffRoles!])) as unknown as Record<VenueType, readonly StaffRole[]>;

export const STAFF_ROLES: readonly StaffRole[] = [...new Set(Object.values(STAFF_ROLES_BY_VENUE).flat())];

export const staffRolesOf = (venue: VenueType): readonly StaffRole[] => STAFF_ROLES_BY_VENUE[venue];

// The role that serves the front desk of each kind of Venue.
export const FRONT_ROLE = Object.fromEntries(VENUE_TYPES.map(type => [type, definitionOf(type).frontRole!])) as Record<VenueType, StaffRole>;

// The Restocker of a Packhouse interior is paid like Staff but belongs to no Venue.
export type WagedRole = StaffRole | 'restocker';

export const STAFF = venues.staff as Omit<typeof venues.staff, 'dailyWage'> & { dailyWage: Record<WagedRole, number> };

// Posts by Tier, from the Venue's Tiers; a role with no post at a Tier cannot be hired there yet.
const postsByTier = (type: VenueType, role: StaffRole): number[] => tiersOf(type).map(({ posts }) => posts?.[role] ?? 0);

export const postsOf = (type: VenueType, role: StaffRole, tier: number): number => {
  const posts = postsByTier(type, role);
  return posts[tier - 1] ?? posts[posts.length - 1]!;
};

export const hireFeeOf = (role: WagedRole): number => STAFF.dailyWage[role] * STAFF.hireFeeDays;

export const minTierOfRole = (type: VenueType, role: StaffRole): number => postsByTier(type, role).findIndex(posts => posts > 0) + 1;

export const hiredOf = (venue: VenueData, role: StaffRole): number => venue.staff?.[role] ?? 0;

export const totalStaff = (venue: VenueData): number => STAFF_ROLES.reduce((total, role) => total + hiredOf(venue, role), 0);

export const wagesPerHour = (venue: VenueData): number =>
  STAFF_ROLES.reduce((total, role) => total + hiredOf(venue, role) * STAFF.dailyWage[role], 0) / STAFF.dayHours;

export const frontRate = (venue: VenueData, type: VenueType): number => Math.min(1, STAFF.frontBaseRate + STAFF.frontRatePerHire * hiredOf(venue, FRONT_ROLE[type]));

// How much of a post is covered, from 0 to 1: a fraction when only part of the hired Staff comes to work.
export const presenceOf = (venue: VenueData, role: StaffRole): number => Math.min(1, hiredOf(venue, role));

export const securityRate = (venue: VenueData, type: VenueType): number => {
  if (!STAFF_ROLES_BY_VENUE[type].includes('security')) return 1;
  const presence = presenceOf(venue, 'security');
  return presence + (1 - presence) * STAFF.withoutSecurityRate;
};

export const managerYield = (venue: VenueData): number => 1 + (STAFF.managerYield - 1) * presenceOf(venue, 'manager');

export const postsAtTier = (type: VenueType, tier: number): number => staffRolesOf(type).reduce((total, role) => total + postsOf(type, role, tier), 0);

// The Staff that actually comes to work: the hired Staff in proportion to the Fill rate.
export const filledStaff = (venue: VenueData, fillRate: number): VenueData =>
  fillRate >= 1 ? venue : { ...venue, staff: Object.fromEntries(STAFF_ROLES.map(role => [role, hiredOf(venue, role) * fillRate])) };
