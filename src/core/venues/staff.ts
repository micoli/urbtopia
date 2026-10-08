import type { StaffRole, VenueData } from '../engine/state';

export const STAFF_ROLES: readonly StaffRole[] = ['manager', 'employee', 'technician', 'security'];

export const STAFF = {
  dayHours: 24,
  dailyWage: { manager: 60, employee: 30, technician: 40, security: 35 } as Record<StaffRole, number>,
  posts: {
    manager: [1, 1, 1],
    employee: [2, 3, 4],
    technician: [1, 1, 2],
    security: [1, 1, 2],
  } as Record<StaffRole, readonly number[]>,
  managerYield: 1.1,
  employeeBaseRate: 0.4,
  employeeRatePerHire: 0.3,
  withoutSecurityRate: 0.9,
};

export const postsOf = (role: StaffRole, tier: number): number => STAFF.posts[role][tier - 1] ?? STAFF.posts[role][STAFF.posts[role].length - 1]!;

export const hiredOf = (venue: VenueData, role: StaffRole): number => venue.staff?.[role] ?? 0;

export const totalStaff = (venue: VenueData): number => STAFF_ROLES.reduce((total, role) => total + hiredOf(venue, role), 0);

export const wagesPerHour = (venue: VenueData): number =>
  STAFF_ROLES.reduce((total, role) => total + hiredOf(venue, role) * STAFF.dailyWage[role], 0) / STAFF.dayHours;

export const employeeRate = (venue: VenueData): number => Math.min(1, STAFF.employeeBaseRate + STAFF.employeeRatePerHire * hiredOf(venue, 'employee'));

export const securityRate = (venue: VenueData): number => (hiredOf(venue, 'security') > 0 ? 1 : STAFF.withoutSecurityRate);

export const managerYield = (venue: VenueData): number => (hiredOf(venue, 'manager') > 0 ? STAFF.managerYield : 1);
