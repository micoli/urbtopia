import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from './walking';
import { citizensOf, congestionStats, createBuilding, newGame, tileKey, type Building, type CongestionStats, type GameState, type HomeCongestion, type SectionLoad } from '../index';
import { diagnoseCongestion } from './diagnosis';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const seed = newGame({ seed: 'traffic', now: 0 });
const base: GameState = { ...seed, buildings: seed.buildings.map(building => ({ ...building, tier: 8 })) };
const noTransit = { lines: [] };
const jam: [number, number][] = [54, 55, 56, 57, 58, 59, 60, 61, 62].map(x => [x, 59]);

function withHomes(state: GameState, spots: readonly [number, number][], tier: number): GameState {
  const homes = spots.map(([x, y], index): Building => ({ ...createBuilding(state.nextId + index, 'home', x, y, 0), tier }));
  return { ...state, nextId: state.nextId + homes.length, buildings: [...state.buildings, ...homes] };
}

const diagnose = (state: GameState, transport: { lines: readonly unknown[] } = noTransit) => diagnoseCongestion(state, congestionStats(state), transport);
const keysOf = (state: GameState, transport?: { lines: readonly unknown[] }) => diagnose(state, transport).causes.map(cause => cause.key);

describe('diagnoseCongestion', () => {
  it('is empty on a city without Congestion', () => {
    expect(diagnose(withHomes(base, [[56, 59]], 1)).causes).toEqual([]);
  });

  it('is empty on a city without Homes', () => {
    expect(diagnose(base).causes).toEqual([]);
  });

  it('explains a jam on roads that are all still Tier 1', () => {
    const state = withHomes(base, jam, 6);
    expect(congestionStats(state).saturatedSections).toBeGreaterThanOrEqual(3);
    const cause = diagnose(state).causes.find(entry => entry.key === 'diagnosis.congestion.untouchedTiers')!;
    expect(cause).toBeDefined();
    expect(cause.params.tier1).toBe(cause.params.saturated);
    expect(cause.focus).toHaveLength(1);
    expect(cause.weight).toBeGreaterThan(0);
  });

  it('does not depend on the order of the buildings', () => {
    const state = withHomes(base, jam, 6);
    const reversed = { ...state, buildings: [...state.buildings].reverse() };
    expect(diagnose(reversed).causes).toEqual(diagnose(state).causes);
  });

  it('tells a city with no public transport line to build one, and a city with lines to extend them', () => {
    const state = withHomes(base, jam, 6);
    expect(keysOf(state, noTransit)).toContain('diagnosis.congestion.noTransit');
    expect(keysOf(state, { lines: [{}] })).toContain('diagnosis.congestion.carHeavy');
  });

  it('weighs the Causes by the Citizens they hurt, heaviest first', () => {
    const state = withHomes(base, jam, 6);
    const weights = diagnose(state).causes.map(cause => cause.weight);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
    expect(weights.every(weight => weight <= 1 && weight > 0)).toBe(true);
    expect(citizensOf(6)).toBeGreaterThan(0);
  });
});

describe('diagnoseCongestion on crafted figures', () => {
  const state = withHomes(base, [[56, 59]], 6);
  const home = state.buildings.at(-1)!;
  const congestedHome: HomeCongestion = { commuters: 100, walkers: 0, cyclists: 0, walkAccess: 0, unemployed: 0, ratio: 2, disconnected: false };
  const section = (x: number, y: number, load: number, capacity = 100): SectionLoad => ({ tile: { x, y }, load, capacity, ratio: load / capacity });
  const figures = (sections: SectionLoad[], overrides: Partial<CongestionStats> = {}): CongestionStats => ({
    ...congestionStats(base),
    sections: new Map(sections.map(entry => [tileKey(entry.tile), entry])),
    homes: new Map([[home.id, congestedHome]]),
    crossings: new Map(),
    modes: { car: 0, transit: 1, walking: 0, cycling: 0 },
    ...overrides,
  });
  const run = (length: number, load: number) => Array.from({ length }, (_, index) => section(10 + index, 20, load - index));

  it('names the busiest run of equally loaded sections and its two ends', () => {
    const cause = diagnoseCongestion(state, figures(run(6, 700)), noTransit).causes.find(entry => entry.key === 'diagnosis.congestion.corridor')!;
    expect(cause.params).toMatchObject({ length: 6, fromX: 10, fromY: 20, toX: 15, toY: 20, capacity: 100 });
    expect(cause.weight).toBeCloseTo(Math.min(1, 700 / citizensOf(6)));
  });

  it('ignores a short run, and sections whose load differs too much to be one flow', () => {
    expect(diagnoseCongestion(state, figures(run(3, 700)), noTransit).causes.map(entry => entry.key)).not.toContain('diagnosis.congestion.corridor');
    const uneven = [section(10, 20, 700), section(11, 20, 300), section(12, 20, 700), section(13, 20, 300)];
    expect(diagnoseCongestion(state, figures(uneven), noTransit).causes.map(entry => entry.key)).not.toContain('diagnosis.congestion.corridor');
  });

  it('blames the Crossings only where they cut the capacity of a saturated section', () => {
    const crossing = { tile: { x: 10, y: 20 }, pedestrians: 300, cut: 0.6, saturated: true };
    const cause = diagnoseCongestion(state, figures([section(10, 20, 400, 40)], { crossings: new Map([[tileKey(crossing.tile), crossing]]) }), noTransit).causes.find(entry => entry.key === 'diagnosis.congestion.crossingsChoke')!;
    expect(cause.params).toEqual({ count: 1, cut: 60 });
    expect(cause.focus).toEqual([{ x: 10, y: 20 }]);
    const light = { ...crossing, cut: 0.05 };
    expect(diagnoseCongestion(state, figures([section(10, 20, 400, 95)], { crossings: new Map([[tileKey(light.tile), light]]) }), noTransit).causes.map(entry => entry.key)).not.toContain('diagnosis.congestion.crossingsChoke');
  });

  it('says nothing about Homes far from Jobs on an uncongested city', () => {
    const farJobs = { ...state, buildings: state.buildings.map(building => (building.type === 'home' ? building : { ...building, x: building.x - 40 })) };
    expect(diagnoseCongestion(farJobs, figures([]), noTransit).causes).toEqual([]);
    const keys = diagnoseCongestion(farJobs, figures([section(10, 20, 400)]), noTransit).causes.map(entry => entry.key);
    expect(keys).toContain('diagnosis.congestion.homesFarFromJobs');
  });

  it('counts the Homes the roads cut off from every workplace', () => {
    const cut: HomeCongestion = { ...congestedHome, disconnected: true, ratio: 2 };
    const cause = diagnoseCongestion(state, figures([], { homes: new Map([[home.id, cut]]), disconnectedSections: [[{ x: 3, y: 4 }]] }), noTransit).causes.find(entry => entry.key === 'diagnosis.congestion.disconnected')!;
    expect(cause.params).toEqual({ homes: 1 });
    expect(cause.focus).toEqual([{ x: 3, y: 4 }]);
    expect(cause.weight).toBe(1);
  });
});
