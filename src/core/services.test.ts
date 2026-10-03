import { describe, expect, it } from 'vitest';
import { FACILITIES, facilityCapacity, uncoveredReason, advance, isWithinReach, categoryCoverageRatio, createBuilding, dispatch, homeBenefits, missingServices, newGame, serviceCoverage, type Building, type Command, type GameState } from './index';
import { ECOLOGY } from './ecology';

const H = ECOLOGY.hourMs;
const b = (id: number, type: Building['type'], x: number, y = 0, extra: Partial<Building> = {}) => ({ ...createBuilding(id, type, x + 50, y + 50, 0), ...extra });
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'services', now: 0 }), buildings, nextId: 100, urbs: 1_000_000, tutorial: null, roads: Array.from({ length: 32 }, (_, index) => ({ x: 48 + index, y: 49, kind: 'road' as const })), adaptationUntil: 0, ...extra,
});
const coveredIds = (state: GameState, type: Building['type']) => [...serviceCoverage(state)].filter(([, types]) => types.has(type as never)).map(([id]) => id);

describe('Facility evolutions', () => {
  it('starts the School at 300 Citizens and raises capacity with each Tier', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map((tier) => facilityCapacity('school', tier))).toEqual([300, 450, 600, 900, 1200, 1650, 2100, 2700]);
    expect(facilityCapacity('townHall', 1)).toBeNull();
  });

  it('serves more Homes when the School is upgraded', () => {
    const homes = [2, 3, 4, 5].map((x, index) => b(10 + index, 'home', x, 0, { tier: 6 }));
    const base = city([b(1, 'school', 0), ...homes]);
    const upgraded = city([b(1, 'school', 0, 0, { tier: 3 }), ...homes]);
    expect(coveredIds(base, 'school')).toHaveLength(2);
    expect(coveredIds(upgraded, 'school')).toHaveLength(4);
  });

  it('upgrades a facility for Urbs only, up to Tier 8, but never the Town hall', () => {
    const state = city([b(2, 'school', 0), b(3, 'townHall', 10)]);
    const send = (id: number, from: GameState) => dispatch(from, { type: 'UpgradeBuilding', buildingId: id }, 0);
    const first = send(2, state);
    expect(first.ok && state.urbs - first.state.urbs).toBe(180);
    let current = state;
    for (let step = 0; step < 7; step++) current = (send(2, current) as { state: GameState }).state;
    expect(current.buildings.find((x) => x.id === 2)?.tier).toBe(8);
    const capped = send(2, current);
    expect(!capped.ok && capped.error.key).toBe('error.maxTier');
    const hall = send(3, state);
    expect(!hall.ok && hall.error.key).toBe('error.maxTier');
  });
});

describe('Service reach', () => {
  it('is a square of twice the radius with corners rounded by 3 tiles', () => {
    expect(isWithinReach(16, 0, 16)).toBe(true);
    expect(isWithinReach(16, 13, 16)).toBe(true);
    expect(isWithinReach(17, 0, 16)).toBe(false);
    expect(isWithinReach(16, 16, 16)).toBe(false);
    expect(isWithinReach(15, 15, 16)).toBe(true);
    expect(isWithinReach(-15.5, 15.5, 16)).toBe(false);
  });

  it('gives the School radius 16 and Fire and Police stations radius 18', () => {
    expect([FACILITIES.school.radius, FACILITIES.fireStation.radius, FACILITIES.policeStation.radius]).toEqual([16, 18, 18]);
  });
});

describe('Service coverage', () => {
  it('covers Homes within the rounded square reach only', () => {
    const state = city([b(1, 'school', 0), b(2, 'home', 6), b(3, 'home', 40)]);
    expect(coveredIds(state, 'school')).toEqual([2]);
  });

  it('applies the larger School reach to Homes', () => {
    const school = b(1, 'school', 0, 0);
    const at = (id: number, x: number, y: number) => b(id, 'home', x, y);
    const state = city([school, at(2, 15, 0), at(3, 20, 0), at(4, 0, 15), at(5, 16, 16), at(6, 13, 13)]);
    expect(coveredIds(state, 'school').sort((a, c) => a - c)).toEqual([2, 4, 6]);
  });

  it('explains why a Home is not covered', () => {
    const near = b(2, 'home', 3, 0, { tier: 8 });
    const crowded = b(3, 'home', 2, 0, { tier: 8 });
    const far = b(4, 'home', 60, 0);
    const state = city([b(1, 'school', 0), near, crowded, far]);
    expect(uncoveredReason(state, far, 'school')).toBe('outOfReach');
    expect(uncoveredReason(state, near, 'hospital')).toBe('none');
    const uncovered = [near, crowded].find(home => !serviceCoverage(state).get(home.id)?.has('school'))!;
    expect(uncoveredReason(state, uncovered, 'school')).toBe('capacityFull');
  });

  it('serves the nearest Homes first until capacity is used', () => {
    const homes = [4, 2, 6, 3, 5].map((x, index) => b(10 + index, 'home', x, 0, { tier: 6 }));
    const state = city([b(1, 'school', 0), ...homes]);
    expect(coveredIds(state, 'school').sort()).toEqual([11, 13]);
  });

  it('lets the last Home cross the capacity so a large Home can still be served', () => {
    const state = city([b(1, 'school', 0), b(2, 'home', 3, 0, { tier: 8 })]);
    expect(coveredIds(state, 'school')).toEqual([2]);
  });

  it('covers the whole city with a Town hall and adds University capacities', () => {
    const far = Array.from({ length: 12 }, (_, index) => b(10 + index, 'home', 100 + index, 0, { tier: 6 }));
    expect(coveredIds(city([b(1, 'townHall', 0), ...far]), 'townHall')).toHaveLength(12);
    expect(coveredIds(city([b(1, 'university', 0), ...far]), 'university')).toHaveLength(12);
    const crowd = Array.from({ length: 14 }, (_, index) => b(10 + index, 'home', 100 + index, 0, { tier: 6 }));
    expect(coveredIds(city([b(1, 'university', 0), ...crowd]), 'university')).toHaveLength(13);
    expect(coveredIds(city([b(1, 'university', 0), b(2, 'university', 1), ...crowd]), 'university')).toHaveLength(14);
  });

  it('reports the share of Citizens covered per Service category', () => {
    const state = city([b(1, 'school', 0), b(2, 'home', 2), b(3, 'home', 40)]);
    expect(categoryCoverageRatio(state, 'education')).toBeCloseTo(0.5);
    expect(categoryCoverageRatio(state, 'health')).toBe(0);
  });
});

describe('Well-being from services', () => {
  it('adds 10 for a covered Service category', () => {
    const home = b(2, 'home', 2);
    expect(homeBenefits(city([b(1, 'school', 0), home]), home).wellbeing).toBeCloseTo(10);
  });

  it('has diminishing returns and stays under 100', () => {
    const home = b(2, 'home', 2);
    const state = city([home, b(1, 'school', 0), b(3, 'hospital', 0, 3), b(4, 'townHall', 0, 6), b(5, 'fireStation', 0, 9), b(6, 'communityHall', 0, 12)]);
    const wellbeing = homeBenefits(state, home).wellbeing;
    expect(wellbeing).toBeGreaterThan(19);
    expect(wellbeing).toBeLessThan(50);
  });

  it('counts a Service category once but stacks different Culture facilities', () => {
    const home = b(2, 'home', 2);
    const education = homeBenefits(city([home, b(1, 'school', 0), b(3, 'middleSchool', 0, 4)]), home).wellbeing;
    expect(education).toBeCloseTo(10);
    const culture = homeBenefits(city([home, b(1, 'communityHall', 0), b(3, 'theater', 0, 4)]), home).wellbeing;
    expect(culture).toBeCloseTo(19);
  });

  it('penalises each missing required service by 10, capped at 40, outside the Adaptation period', () => {
    const home = b(2, 'home', 2, 0, { tier: 6 });
    expect(homeBenefits(city([home]), home).wellbeing).toBe(-40);
    const fifth = b(6, 'home', 2, 0, { tier: 5 });
    expect(homeBenefits(city([fifth, b(1, 'school', 0), b(3, 'highSchool', 0, 4)]), fifth).wellbeing).toBeCloseTo(0);
    expect(homeBenefits(city([home], { adaptationUntil: H }), home).wellbeing).toBe(0);
    expect(homeBenefits(city([b(5, 'home', 2, 0, { tier: 2 })]), b(5, 'home', 2, 0, { tier: 2 })).wellbeing).toBe(0);
  });

  it('only penalises services the current Tier requires', () => {
    const home = b(2, 'home', 2, 0, { tier: 3 });
    expect(missingServices(serviceCoverage(city([home])), home)).toEqual(['school']);
    expect(homeBenefits(city([home]), home).wellbeing).toBe(-10);
  });
});

describe('Tax multiplier', () => {
  it('uses 1 + Well-being / 500', () => {
    const home = b(2, 'home', 2, 0, { tier: 2 });
    const served = city([home, b(1, 'school', 0)], { adaptationUntil: 2 * H });
    const next = advance(served, H).state.buildings.find(x => x.id === 2)!;
    expect(next.taxCitizenMs).toBeCloseTo(15 * H * (1 + 10 / 500), 0);
  });
});

describe('Tier gates', () => {
  const upgrade: Command = { type: 'UpgradeBuilding', buildingId: 2 };
  const goods = { planks: 20, bricks: 20, tiles: 20, tools: 20, glass: 20, circuits: 20, steel: 20, cement: 20, crystal: 20, jewelry: 20 };
  const rich = (buildings: Building[]) => city([...buildings, b(30, 'waterTower', 80, 3)], { storage: { materials: {}, goods } });
  const run = (state: GameState) => dispatch(state, upgrade, state.lastSeen);

  it('blocks a Tier without the required service and allows it once covered', () => {
    const home = b(2, 'home', 2, 0, { tier: 2 });
    const blocked = run(rich([home]));
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.key).toBe('error.serviceRequired');
    expect(run(rich([home, b(1, 'school', 0)])).ok).toBe(true);
  });

  it('keeps every earlier requirement for higher Tiers', () => {
    const home = b(2, 'home', 2, 0, { tier: 4 });
    const school = [b(1, 'school', 0)];
    expect(run(rich([home, ...school])).ok).toBe(false);
    expect(run(rich([home, ...school, b(3, 'highSchool', 0, 4), b(4, 'hospital', 0, 8)])).ok).toBe(true);
  });

  it('does not require a Middle school, a High school, a University or Culture', () => {
    const home = b(2, 'home', 2, 0, { tier: 7 });
    const required = ['school', 'hospital', 'townHall', 'fireStation', 'policeStation'] as const;
    const services = required.map((type, index) => b(10 + index, type, 0, 4 + index));
    expect(missingServices(serviceCoverage(city([home, ...services])), home, 8)).toEqual([]);
  });

  it('never downgrades a Home that loses coverage', () => {
    const home = b(2, 'home', 2, 0, { tier: 4 });
    const state = city([home, b(1, 'school', 0), b(3, 'middleSchool', 0, 4)]);
    const lost = advance({ ...state, buildings: state.buildings.filter(x => x.type === 'home') }, 2 * H).state;
    expect(lost.buildings.find(x => x.id === 2)?.tier).toBe(8);
    expect(homeBenefits(lost, lost.buildings[0]!).wellbeing).toBe(-10);
  });
});

describe('Adaptation period', () => {
  it('suspends service penalties until it ends, including during catch-up and Time skip', () => {
    const home = b(2, 'home', 2, 0, { tier: 3 });
    const state = city([home, b(31, 'backup', 20)], { adaptationUntil: 5 * H });
    const caught = advance(state, 6 * H).state.buildings[0]!;
    expect(caught.taxCitizenMs).toBeCloseTo(32 * (5 * H + H * (1 - 10 / 500)), -2);
    const skipped = dispatch(state, { type: 'SkipTime', hours: 10 }, 0);
    expect(skipped.ok && skipped.state.adaptationUntil).toBe(-5 * H);
  });
});

describe('Facility unlock and placement', () => {
  it('announces each Public facility when Citizens reach its threshold', () => {
    const home = b(1, 'home', 0, 0);
    const state = city([home, b(30, 'waterTower', 20)], { storage: { materials: {}, goods: { planks: 10 } } });
    const result = dispatch(state, { type: 'UpgradeBuilding', buildingId: 1 }, 0);
    expect(result.ok && result.events.filter(e => e.type === 'FacilityUnlocked')).toEqual([{ type: 'FacilityUnlocked', facility: 'school' }]);
  });

  it('refuses a second Town hall and a locked facility', () => {
    const owned = { ownedParcels: [{ x: 3, y: 3 }] };
    const first = dispatch(city([], owned), { type: 'PlaceBuilding', buildingType: 'townHall', x: 50, y: 50, rotation: 0 }, 0);
    expect(!first.ok && first.error.key).toBe('error.itemLocked');
    const unlocked = city([b(1, 'townHall', 0, 0), ...Array.from({ length: 6 }, (_, index) => b(10 + index, 'home', 10 + index, 20, { tier: 6 }))], owned);
    const second = dispatch(unlocked, { type: 'PlaceBuilding', buildingType: 'townHall', x: 56, y: 50, rotation: 0 }, 0);
    expect(!second.ok && second.error.key).toBe('error.townHallExists');
  });
});
