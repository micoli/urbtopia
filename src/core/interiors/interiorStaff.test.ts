import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, interiorFamilyOf, interiorPostsOf, jobsOf, newGame, type Building, type Command, type GameState } from '../index';
import { flagOfCommandIn } from '../../featureFlags/featureFlags';
import { interiorRoleShare } from './interiorParts';
import { interiorRolesOf, interiorWagesPerHour, partOfRole, totalInteriorStaff } from './interiorStaff';
import { payInteriorStaff } from './interiorStaffCommands';
import { STAFF, hireFeeOf } from '../venues/staff';

const city = (tier = 3, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'interiors', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [{ ...createBuilding(1, 'bakery', 55, 50, 0), tier }, { ...createBuilding(2, 'school', 60, 50, 0), tier }, createBuilding(3, 'arcade', 65, 50, 0)],
});
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  return result.ok ? null : result.error.key;
};
const building = (state: GameState, id: number): Building => state.buildings.find(candidate => candidate.id === id)!;
const hire = (buildingId: number, role: 'baker' | 'seller' | 'teacher' | 'miller'): Command => ({ type: 'HireInteriorStaff', buildingId, role });
const release = (buildingId: number, role: 'baker' | 'seller' | 'teacher'): Command => ({ type: 'ReleaseInteriorStaff', buildingId, role });

describe('what each building declares', () => {
  it('has a family and roles that each carry one part', () => {
    expect(interiorFamilyOf('bakery')).toBe('production');
    expect(interiorFamilyOf('school')).toBe('service');
    expect(interiorFamilyOf('arcade')).toBeUndefined();
    expect(interiorRolesOf('bakery')).toEqual(['baker', 'seller']);
    expect(partOfRole('bakery', 'baker')).toBe('speed');
    expect(partOfRole('bakery', 'seller')).toBe('salesRate');
    expect(interiorRolesOf('hospital')).toEqual(['nurse', 'doctor', 'surgeon']);
  });

  it('opens the posts of a role at a Tier of its own', () => {
    expect(interiorPostsOf('bakery', 'baker', 1)).toBe(0);
    expect(interiorPostsOf('bakery', 'baker', 2)).toBe(1);
    expect(interiorPostsOf('bakery', 'baker', 5)).toBe(2);
    expect(interiorPostsOf('bakery', 'baker', 9)).toBe(2);
    expect(interiorPostsOf('hospital', 'surgeon', 2)).toBe(0);
    expect(interiorPostsOf('hospital', 'surgeon', 3)).toBe(1);
  });
});

describe('hiring Staff in an interior', () => {
  it('costs five days of wages once, and fills a post of the building', () => {
    const state = send(city(), hire(1, 'baker'));
    expect(building(state, 1).interior?.staff).toEqual({ baker: 1 });
    expect(state.urbs).toBe(100_000 - hireFeeOf('baker'));
    expect(hireFeeOf('baker')).toBe(STAFF.dailyWage.baker * STAFF.hireFeeDays);
  });

  it('refuses a role the building does not have, a Tier too low and a post taken', () => {
    expect(failure(city(), hire(1, 'teacher'))).toBe('error.unknownBuilding');
    expect(failure(city(1), hire(1, 'baker'))).toBe('error.tierTooLow');
    expect(failure(send(city(3), hire(1, 'baker')), hire(1, 'baker'))).toBe('error.noStaffPost');
  });

  it('refuses when the city cannot pay the fee', () => {
    expect(failure(city(3, hireFeeOf('baker') - 1), hire(1, 'baker'))).toBe('error.notEnoughUrbs');
  });

  it('releases without a refund, and leaves nothing behind at zero', () => {
    const hired = send(city(), hire(1, 'baker'));
    const released = send(hired, release(1, 'baker'));
    expect(building(released, 1).interior?.staff).toEqual({});
    expect(released.urbs).toBe(hired.urbs);
    expect(failure(released, release(1, 'baker'))).toBe('error.noStaffToRelease');
  });

  it('adds the hired Staff to the Jobs of the building', () => {
    const before = jobsOf(building(city(), 1));
    const state = send(send(city(), hire(1, 'baker')), hire(1, 'seller'));
    expect(totalInteriorStaff(building(state, 1))).toBe(2);
    expect(jobsOf(building(state, 1))).toBe(before + 2);
  });

  it('leaves a building with no Staff exactly as it was', () => {
    expect(building(city(), 2).interior).toBeUndefined();
    expect(jobsOf(building(city(), 2))).toBe(jobsOf({ ...building(city(), 2), interior: { fixtures: [], nextFixtureId: 1 } }));
  });
});

describe('the part of the effect a role delivers', () => {
  const state = send(send(city(5), hire(1, 'baker')), hire(1, 'baker'));

  it('is the hired Staff that come to work over the posts of the Tier', () => {
    const bakery = building(state, 1);
    expect(interiorRoleShare(bakery, 'baker', 1)).toBe(1);
    expect(interiorRoleShare(bakery, 'baker', 0.5)).toBe(0.5);
    expect(interiorRoleShare(bakery, 'baker', 0)).toBe(0);
  });

  it('is a share of the posts when only some are hired', () => {
    const one = send(send(city(5), hire(1, 'baker')), hire(1, 'seller'));
    expect(interiorRoleShare(building(one, 1), 'baker', 1)).toBe(0.5);
  });

  it('is nothing for a role that is not hired, whatever the other roles give', () => {
    expect(interiorRoleShare(building(state, 1), 'seller', 1)).toBe(0);
  });
});

describe('paying the Staff', () => {
  it('takes the wages by the hour, as far as the Urbs go', () => {
    const hired = send(city(), hire(1, 'baker'));
    const paid = payInteriorStaff(hired, 0, 3_600_000);
    expect(hired.urbs - paid.urbs).toBeCloseTo(interiorWagesPerHour(building(hired, 1)), 6);
    expect(payInteriorStaff({ ...hired, urbs: 0 }, 0, 3_600_000).urbs).toBe(0);
  });

  it('pays nothing to a city with no Staff', () => {
    expect(payInteriorStaff(city(), 0, 3_600_000).urbs).toBe(100_000);
  });
});

describe('the flags of the families', () => {
  it('gate the Staff commands by the family of the building', () => {
    expect(flagOfCommandIn(hire(1, 'baker'), city())).toBe('productionInterior');
    expect(flagOfCommandIn(hire(2, 'teacher'), city())).toBe('serviceInterior');
    expect(flagOfCommandIn(release(2, 'teacher'), city())).toBe('serviceInterior');
    expect(flagOfCommandIn(hire(3, 'baker'), city())).toBeUndefined();
    expect(flagOfCommandIn({ type: 'Collect', buildingId: 1 } as Command, city())).toBeUndefined();
  });
});
