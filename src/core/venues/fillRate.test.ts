import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type GameState, type StaffRole } from '../index';
import { commuteRoad } from './commuteRoad';
import { STAFF, venueFillRate } from './venues';
import { filledStaff, managerYield, postsAtTier, presenceOf, securityRate } from './staff';

const arcade = (staff: Partial<Record<StaffRole, number>>): Building & { venue: NonNullable<Building['venue']> } => ({
  ...createBuilding(1, 'arcade', 55, 50, 0),
  tier: 3,
  venue: { fixtures: [], nextFixtureId: 1, takings: 0, staff },
}) as never;

const cityOf = (buildings: Building[]): GameState => ({ ...newGame({ seed: 'fill-rate', now: 0 }), tutorial: null, adaptationUntil: 0, buildings, roads: commuteRoad });

describe('Venue Fill rate', () => {
  it('is complete for a Venue with no hired Staff', () => {
    const venue = arcade({});
    expect(venueFillRate(cityOf([venue]), venue)).toBe(1);
  });

  it('is empty when no Citizen can commute to the hired Staff posts', () => {
    const venue = arcade({ employee: 2 });
    expect(venueFillRate(cityOf([venue]), venue)).toBe(0);
  });

  it('rises with the Citizens who commute to the Venue, up to complete', () => {
    const venue = arcade({ employee: 2 });
    const home = { ...createBuilding(2, 'home', 52, 50, 0), tier: 4 };
    const rate = venueFillRate(cityOf([venue, home]), venue);
    expect(rate).toBeGreaterThan(0);
    expect(rate).toBeLessThanOrEqual(1);
  });

  it('stops hired Staff counting in full when only part of it comes to work', () => {
    const hired = arcade({ manager: 1, security: 1 }).venue;
    expect(managerYield(hired)).toBe(STAFF.managerYield);
    expect(managerYield(filledStaff(hired, 0))).toBe(1);
    expect(managerYield(filledStaff(hired, 0.5))).toBeCloseTo(1 + (STAFF.managerYield - 1) / 2);
    expect(securityRate(filledStaff(hired, 0), 'arcade')).toBe(STAFF.withoutSecurityRate);
    expect(presenceOf(filledStaff(hired, 0.25), 'manager')).toBe(0.25);
  });

  it('leaves integer Staff untouched when the Fill rate is complete', () => {
    const hired = arcade({ manager: 1 }).venue;
    expect(filledStaff(hired, 1)).toBe(hired);
  });

  it('counts the posts of a Tier', () => {
    expect(postsAtTier('arcade', 3)).toBeGreaterThan(postsAtTier('arcade', 1));
  });
});
