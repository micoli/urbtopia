import type { StaffRole, VenueData, VenueType } from '../engine/state';

export const STAFF_ROLES_BY_VENUE: Record<VenueType, readonly StaffRole[]> = {
  arcade: ['manager', 'employee', 'technician', 'security'],
  supermarket: ['manager', 'cashier', 'stocker', 'security'],
  hotel: ['manager', 'receptionist', 'housekeeper', 'technician'],
};

export const STAFF_ROLES: readonly StaffRole[] = [...new Set(Object.values(STAFF_ROLES_BY_VENUE).flat())];

export const staffRolesOf = (venue: VenueType): readonly StaffRole[] => STAFF_ROLES_BY_VENUE[venue];

// The role that serves the front desk of each kind of Venue.
export const FRONT_ROLE: Record<VenueType, StaffRole> = { arcade: 'employee', supermarket: 'cashier', hotel: 'receptionist' };

export const STAFF = {
  dayHours: 24,
  dailyWage: { manager: 60, employee: 30, technician: 40, security: 35, cashier: 30, stocker: 28, receptionist: 32, housekeeper: 26 } as Record<StaffRole, number>,
  // Posts by Tier; a role with no post at a Tier cannot be hired there yet.
  posts: {
    manager: [0, 1, 1],
    employee: [1, 2, 3],
    technician: [0, 0, 2],
    security: [0, 1, 2],
    cashier: [1, 2, 3],
    stocker: [0, 1, 2],
    receptionist: [1, 1, 2],
    housekeeper: [1, 2, 3],
  } as Record<StaffRole, readonly number[]>,
  // Hiring costs this many days of wages, once.
  hireFeeDays: 5,
  managerYield: 1.1,
  frontBaseRate: 0.4,
  frontRatePerHire: 0.3,
  withoutSecurityRate: 0.9,
};

export const postsOf = (role: StaffRole, tier: number): number => STAFF.posts[role][tier - 1] ?? STAFF.posts[role][STAFF.posts[role].length - 1]!;

export const hireFeeOf = (role: StaffRole): number => STAFF.dailyWage[role] * STAFF.hireFeeDays;

export const minTierOfRole = (role: StaffRole): number => STAFF.posts[role].findIndex(posts => posts > 0) + 1;

export const hiredOf = (venue: VenueData, role: StaffRole): number => venue.staff?.[role] ?? 0;

export const totalStaff = (venue: VenueData): number => STAFF_ROLES.reduce((total, role) => total + hiredOf(venue, role), 0);

export const wagesPerHour = (venue: VenueData): number =>
  STAFF_ROLES.reduce((total, role) => total + hiredOf(venue, role) * STAFF.dailyWage[role], 0) / STAFF.dayHours;

export const frontRate = (venue: VenueData, type: VenueType): number => Math.min(1, STAFF.frontBaseRate + STAFF.frontRatePerHire * hiredOf(venue, FRONT_ROLE[type]));

export const securityRate = (venue: VenueData, type: VenueType): number =>
  !STAFF_ROLES_BY_VENUE[type].includes('security') || hiredOf(venue, 'security') > 0 ? 1 : STAFF.withoutSecurityRate;

export const managerYield = (venue: VenueData): number => (hiredOf(venue, 'manager') > 0 ? STAFF.managerYield : 1);
