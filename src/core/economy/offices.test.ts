import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { copyThresholds, maxCopies, nextCopyCost } from '../buildings/buildLimit';
import { upgradeCostOf } from './tiers';
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
    expect(jobs).toEqual([40, 80, 120, 150, 190, 240, 300]);
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

describe('Office data', () => {
  it('opens at 500 Citizens and allows five copies, the last two at 4000', () => {
    expect(copyThresholds('office')).toEqual([500, 1000, 2000, 4000, 4000]);
    expect(maxCopies('office')).toBe(5);
  });

  it('costs 25% more for each copy already built', () => {
    expect(nextCopyCost(empty, 'office')).toBe(1500);
    expect(nextCopyCost(city([]).state, 'office')).toBe(1875);
  });

  it('asks more Urbs for each upgrade and draws more power with each Tier', () => {
    const upgrades = [2, 3].map((tier) => upgradeCostOf('office', tier)!.urbs);
    expect(upgrades[0]).toBeGreaterThan(0);
    expect(upgrades[1]).toBeGreaterThan(upgrades[0]!);
    const costs = [2, 3, 4, 5, 6, 7].map((tier) => upgradeCostOf('office', tier)!.urbs);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
    const powers = tiersOf('office').map((tier) => tier.power!);
    expect(powers).toEqual([...powers].sort((a, b) => a - b));
  });
});

describe('Placing an Office', () => {
  const rich = { ...empty, urbs: 100_000 };
  const place = { type: 'PlaceBuilding', buildingType: 'office', x: 57, y: 56 } as const;
  const populated = (homes: number): GameState => ({ ...rich, buildings: Array.from({ length: homes }, (_, index) => ({ ...createBuilding(20 + index, 'home', 40 + (index % 10) * 2, 40 + Math.floor(index / 10) * 2, 0), tier: 8 })) });

  it('is locked below 500 Citizens', () => {
    const result = dispatch(populated(1), place, T0);
    expect(result.ok).toBe(false);
  });

  it('is built from 500 Citizens, for its base price', () => {
    const state = populated(Math.ceil(500 / citizensOf(8)));
    const result = dispatch(state, place, T0);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.state.urbs).toBe(state.urbs - 1500);
    expect(officeIn(result.state).tier).toBe(1);
  });
});

describe('Office Tiers', () => {
  const footprints = tiersOf('office').map((tier) => tier.footprint);

  it('draws a 2x2 block for the first three Tiers and a 3x3 block for the next four', () => {
    expect(tiersOf('office')).toHaveLength(7);
    expect(footprints.slice(0, 3)).toEqual([[2, 2], [2, 2], [2, 2]]);
    expect(footprints.slice(3)).toEqual([[3, 3], [3, 3], [3, 3], [3, 3]]);
  });

  it('grows on its site when upgraded from the 2x2 block to the 3x3 block', () => {
    const office: Building = { ...createBuilding(10, 'office', 57, 56, 2), tier: 3 };
    const state: GameState = { ...empty, urbs: 1_000_000, storage: { materials: {}, goods: { glass: 50 } }, buildings: [office] };
    const result = dispatch(state, { type: 'UpgradeBuilding', buildingId: office.id }, T0);
    if (!result.ok) throw new Error(result.error.key);
    expect(officeIn(result.state).tier).toBe(4);
  });
});
