import venues from '../../../assets/defs/balance/venues.json' with { type: 'json' };
import { definitionOf, tiersOf } from '../buildings/buildingDefinitions';
import type { StaffRole, VenueData, VenueType } from '../engine/state';
import { VENUE_TYPES } from './profiles';

export const STAFF_ROLES_BY_VENUE = Object.fromEntries(VENUE_TYPES.map(type => [type, definitionOf(type).staffRoles!])) as unknown as Record<VenueType, readonly StaffRole[]>;

export const STAFF_ROLES: readonly StaffRole[] = [...new Set(Object.values(STAFF_ROLES_BY_VENUE).flat())];

export const staffRolesOf = (venue: VenueType): readonly StaffRole[] => STAFF_ROLES_BY_VENUE[venue];

// The role that serves the front desk of each kind of Venue.
export const FRONT_ROLE = Object.fromEntries(VENUE_TYPES.map(type => [type, definitionOf(type).frontRole!])) as Record<VenueType, StaffRole>;

export const STAFF = venues.staff as Omit<typeof venues.staff, 'dailyWage'> & { dailyWage: Record<StaffRole, number> };

// Posts by Tier, from the Venue's Tiers; a role with no post at a Tier cannot be hired there yet.
const postsByTier = (type: VenueType, role: StaffRole): number[] => tiersOf(type).map(({ posts }) => posts?.[role] ?? 0);

export const postsOf = (type: VenueType, role: StaffRole, tier: number): number => {
  const posts = postsByTier(type, role);
  return posts[tier - 1] ?? posts[posts.length - 1]!;
};

export const hireFeeOf = (role: StaffRole): number => STAFF.dailyWage[role] * STAFF.hireFeeDays;

export const minTierOfRole = (type: VenueType, role: StaffRole): number => postsByTier(type, role).findIndex(posts => posts > 0) + 1;

export const hiredOf = (venue: VenueData, role: StaffRole): number => venue.staff?.[role] ?? 0;

export const totalStaff = (venue: VenueData): number => STAFF_ROLES.reduce((total, role) => total + hiredOf(venue, role), 0);

export const wagesPerHour = (venue: VenueData): number =>
  STAFF_ROLES.reduce((total, role) => total + hiredOf(venue, role) * STAFF.dailyWage[role], 0) / STAFF.dayHours;

export const frontRate = (venue: VenueData, type: VenueType): number => Math.min(1, STAFF.frontBaseRate + STAFF.frontRatePerHire * hiredOf(venue, FRONT_ROLE[type]));

export const securityRate = (venue: VenueData, type: VenueType): number =>
  !STAFF_ROLES_BY_VENUE[type].includes('security') || hiredOf(venue, 'security') > 0 ? 1 : STAFF.withoutSecurityRate;

export const managerYield = (venue: VenueData): number => (hiredOf(venue, 'manager') > 0 ? STAFF.managerYield : 1);
