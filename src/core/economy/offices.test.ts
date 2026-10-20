import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { advance, citizensOf, congestionStats, createBuilding, dispatch, jobsOf, newGame, type Building, type GameState } from '../index';
import { WALKING } from '../traffic/walking';
import { tiersOf } from '../buildings/buildingDefinitions';
import { advanceProduction } from './production';
import { OFFICE, OFFICE_TYPES, officeUrbsDue } from './offices';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const empty = { ...newGame({ seed: 'offices', now: T0 }), buildings: [], urbs: 0 };

function city(homeTiers: number[], officeTier = 1): { state: GameState; office: Building } {
  const office: Building = { ...createBuilding(10, 'office', 57, 56, 2), tier: officeTier };
  const homes = homeTiers.map((tier, index): Building => ({ ...createBuilding(20 + index, 'home', 56 + index * 2, 59, 0), tier }));
  return { state: { ...empty, buildings: [office, ...homes] }, office };
}

const officeIn = (state: GameState): Building => state.buildings.find((building) => building.type === 'office')!;

describe('Office building', () => {
  it('is a workplace whose Jobs come from its Tier', () => {
    expect(OFFICE_TYPES).toEqual(['office']);
    const jobs = tiersOf('office').map((tier) => tier.jobs);
    expect(jobs).toEqual([40, 80, 120]);
    for (const [index, expected] of jobs.entries()) expect(jobsOf({ ...createBuilding(1, 'office', 0, 0, 0), tier: index + 1 })).toBe(expected);
  });

  it('fills its Jobs with the Commuters of the Homes around it', () => {
    const { state, office } = city([1]);
    expect(congestionStats(state).filledJobs.get(office.id)).toBe(citizensOf(1));
  });

  it('never fills more Jobs than it offers', () => {
    const { state, office } = city([8, 8]);
    expect(congestionStats(state).filledJobs.get(office.id)).toBe(jobsOf(office));
  });

  it('has no filled Job without a Home to commute from', () => {
    const { state, office } = city([]);
    expect(congestionStats(state).filledJobs.get(office.id) ?? 0).toBe(0);
  });
});

describe('Office income', () => {
  it('earns Urbs for every filled Job and every hour', () => {
    const { state } = city([1]);
    const later = advance(state, T0 + 2 * HOUR).state;
    expect(officeUrbsDue(officeIn(later))).toBe(Math.floor(citizensOf(1) * 2 * OFFICE.urbsPerJobPerHour));
  });

  it('earns nothing without filled Jobs', () => {
    const { state } = city([]);
    expect(officeUrbsDue(officeIn(advance(state, T0 + 2 * HOUR).state))).toBe(0);
  });

  it('stops earning at the cap, whatever the Tier', () => {
    const { state } = city([8, 8, 8], 2);
    const later = advance(state, T0 + 20 * HOUR).state;
    expect(officeUrbsDue(officeIn(later))).toBe(jobsOf(officeIn(later)) * OFFICE.capHours * OFFICE.urbsPerJobPerHour);
  });

  it('earns nothing while the city cannot power it', () => {
    const { state } = city([1]);
    const filledJobs = new Map([[officeIn(state).id, 5]]);
    const dark = advanceProduction(state, T0 + HOUR, HOUR, 0, new Map(), new Set(), filledJobs).state;
    expect(officeUrbsDue(officeIn(dark))).toBe(0);
    const lit = advanceProduction(state, T0 + HOUR, HOUR, 1, new Map(), new Set(), filledJobs).state;
    expect(officeUrbsDue(officeIn(lit))).toBe(5);
  });
});

describe('Collecting an Office', () => {
  it('pays the Urbs earned and keeps the part of an hour', () => {
    const { state } = city([1]);
    const later = advance(state, T0 + 2 * HOUR).state;
    const due = officeUrbsDue(officeIn(later));
    const result = dispatch(later, { type: 'Collect', buildingId: officeIn(later).id }, T0 + 2 * HOUR);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.state.urbs).toBe(later.urbs + due);
    expect(officeUrbsDue(officeIn(result.state))).toBe(0);
  });

  it('refuses when nothing was earned', () => {
    const { state } = city([1]);
    const result = dispatch(state, { type: 'Collect', buildingId: officeIn(state).id }, T0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.key).toBe('error.nothingToCollect');
  });
});
