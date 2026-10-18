import { describe, expect, it } from 'vitest';
import { WASTE, WASTE_FACILITIES, advance, createBuilding, homeWasteProduction, isWasteCovered, isWasteMissing, isWasteSanctioned, newGame, wasteCapacity, wasteCauseOf, wasteReport, type Building, type GameState } from '../index';
import { ECOLOGY } from '../environment/ecology';

const H = ECOLOGY.hourMs;
const home = (id: number, x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, 'home', x, y, 0), tier });
const facility = (id: number, kind: 'mound' | 'incinerator' | 'recyclingPlant', x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, 'home', x, y, 0), type: kind as never, tier });
const roadRow = (from: number, to: number, y: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x: from + index, y, kind: 'road' as const }));
const wayColumn = (x: number, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ x, y: from + index }));
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'waste', now: 0 }), buildings, nextId: 1000, urbs: 1_000_000, tutorial: null, roads: roadRow(40, 80, 49), roundabouts: [], pedestrianWays: [], adaptationUntil: 0, ...extra,
});
const served = (state: GameState, facilityId: number) => [...wasteReport(state).homes].filter(([, waste]) => waste.facilityId === facilityId).map(([id]) => id).sort((a, b) => a - b);

describe('Waste production', () => {
  it('is the Citizens of a Home times the Balance rate, and is never saved', () => {
    expect(homeWasteProduction(4)).toBe(60 * WASTE.unitsPerCitizenPerDay);
    const state = city([home(1, 50, 50, 4), home(2, 52, 50, 1)]);
    const before = JSON.stringify(state);
    expect(wasteReport(state).produced).toBe(homeWasteProduction(4) + homeWasteProduction(1));
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('Waste allocation', () => {
  it('uses the Recycling plant before the Incinerator, and the Incinerator before the Mound, nearest Homes first', () => {
    const homes = Array.from({ length: 10 }, (_, index) => home(10 + index, 50 + 2 * index, 50, 4));
    const state = city([facility(1, 'recyclingPlant', 60, 47), facility(2, 'incinerator', 58, 47), facility(3, 'mound', 62, 50), ...homes]);
    expect(served(state, 1)).toEqual([12, 13, 14, 15, 16, 17, 18]);
    expect(served(state, 2)).toEqual([10, 11, 19]);
    expect(wasteReport(state).facilities.get(1)?.processed).toBe(7 * homeWasteProduction(4));
    expect(wasteReport(state).facilities.get(3)?.processed).toBe(0);
  });

  it('serves the nearest Homes of a facility first, and the Home crossing the capacity is still served', () => {
    const homes = [home(10, 60, 48, 3), home(11, 62, 48, 3), home(12, 64, 48, 3)];
    const state = city([facility(1, 'mound', 66, 50), ...homes]);
    expect(wasteCapacity('mound', 1)).toBe(60);
    expect(served(state, 1)).toEqual([11, 12]);
    expect(wasteCauseOf(wasteReport(state), 10)).toBe('capacityFull');
    expect(wasteReport(state).facilities.get(1)?.processed).toBe(2 * homeWasteProduction(3));
  });

  it('charges the relative tariffs 1:3:6 per unit processed', () => {
    const cost = (kind: 'mound' | 'incinerator' | 'recyclingPlant') => wasteReport(city([facility(1, kind, 66, kind === 'mound' ? 50 : 47), home(10, 60, 48, 2)])).costPerDay;
    const unit = homeWasteProduction(2);
    expect([cost('mound'), cost('incinerator'), cost('recyclingPlant')]).toEqual([unit, 3 * unit, 6 * unit]);
    expect(wasteReport(city([facility(1, 'mound', 66, 50), home(10, 60, 48, 2)])).costPerHour).toBe(unit / WASTE.dayHours);
  });

  it('stops every facility when the Urbs cannot pay, without debt', () => {
    const state = city([facility(1, 'mound', 66, 50), home(10, 64, 48)], { urbs: 0 });
    const report = wasteReport(state);
    expect(isWasteCovered(report, 10)).toBe(false);
    expect(wasteCauseOf(report, 10)).toBe('facilityStopped');
    expect(report.processed).toBe(0);
    expect(report.costPerHour).toBe(0);
    expect(isWasteCovered(wasteReport({ ...state, urbs: 5 }), 10)).toBe(true);
  });
});

describe('Waste coverage and its causes', () => {
  it('covers a Home next to a Road linked to the facility', () => {
    const state = city([facility(1, 'mound', 66, 50), home(10, 64, 48)]);
    expect(isWasteCovered(wasteReport(state), 10)).toBe(true);
  });

  it('says out of reach when no facility reaches the Home', () => {
    const state = city([facility(1, 'mound', 42, 50), home(10, 70, 48)]);
    expect(wasteCauseOf(wasteReport(state), 10)).toBe('outOfReach');
    expect(wasteCauseOf(wasteReport(city([home(10, 70, 48)])), 10)).toBe('outOfReach');
  });

  it('says no road link for a Home on a Road the facility does not join, and for a Home without any Road', () => {
    const apart = city([facility(1, 'incinerator', 66, 47), home(10, 65, 57), home(11, 66, 58)], { roads: [...roadRow(40, 80, 49), ...roadRow(60, 70, 56)] });
    expect(wasteCauseOf(wasteReport(apart), 10)).toBe('noRoadLink');
    expect(wasteCauseOf(wasteReport(apart), 11)).toBe('noRoadLink');
  });

  it('says no road link when the facility itself touches no Road', () => {
    const state = city([facility(1, 'mound', 66, 52), home(10, 64, 50)]);
    expect(wasteReport(state).facilities.get(1)?.linked).toBe(false);
    expect(wasteCauseOf(wasteReport(state), 10)).toBe('noRoadLink');
  });
});

describe('Waste through a Pedestrian path network', () => {
  const carrying = (wayLength: number, homeY: number) => city([facility(1, 'incinerator', 66, 47), home(10, 71, homeY)], { pedestrianWays: wayColumn(70, 50, 50 + wayLength) });

  it('joins a pedestrian-only Home within the Carrying distance, at the surcharge', () => {
    const state = carrying(WASTE.carryingDistance - 1, 50 + WASTE.carryingDistance - 1);
    const waste = wasteReport(state).homes.get(10);
    expect(waste?.cause).toBeNull();
    expect(waste?.carried).toBe(true);
    expect(waste?.cost).toBe(homeWasteProduction(1) * WASTE_FACILITIES.incinerator.tariff * WASTE.carriedSurcharge);
  });

  it('charges a Home on a Road the plain tariff', () => {
    const state = city([facility(1, 'incinerator', 66, 47), home(10, 70, 48)]);
    const waste = wasteReport(state).homes.get(10);
    expect(waste?.carried).toBe(false);
    expect(waste?.cost).toBe(homeWasteProduction(1) * WASTE_FACILITIES.incinerator.tariff);
  });

  it('leaves a Home beyond the Carrying distance uncovered', () => {
    const state = carrying(WASTE.carryingDistance, 50 + WASTE.carryingDistance);
    expect(wasteCauseOf(wasteReport(state), 10)).toBe('beyondCarryingDistance');
  });

  it('says no road link when the Pedestrian ways reach no Road', () => {
    const state = city([facility(1, 'incinerator', 66, 47), home(10, 71, 54)], { pedestrianWays: wayColumn(70, 52, 54) });
    expect(wasteCauseOf(wasteReport(state), 10)).toBe('noRoadLink');
  });
});

describe('Mound access', () => {
  it('works through an adjacent Mound that touches a Road', () => {
    const state = city([facility(1, 'mound', 66, 50), facility(2, 'mound', 66, 51), facility(3, 'mound', 66, 56)]);
    const { facilities } = wasteReport(state);
    expect([1, 2, 3].map(id => facilities.get(id)?.linked)).toEqual([true, true, false]);
  });

  it('works through a group touching a Pedestrian way that reaches a Road, however far', () => {
    const mound = facility(1, 'mound', 76, 60);
    const ways = wayColumn(75, 50, 60);
    expect(wasteReport(city([mound], { pedestrianWays: ways })).facilities.get(1)?.linked).toBe(true);
    expect(wasteReport(city([mound])).facilities.get(1)?.linked).toBe(false);
  });

  it('is not extended to the Incinerator and the Recycling plant', () => {
    const state = city([facility(1, 'incinerator', 76, 60)], { pedestrianWays: wayColumn(75, 50, 60) });
    expect(wasteReport(state).facilities.get(1)?.linked).toBe(false);
  });
});

describe('Waste Sanction and Adaptation period', () => {
  const bigCity = [home(20, 44, 50, 8), home(21, 48, 50, 8)];
  const uncovered = (extra: Partial<GameState>) => city([home(10, 70, 48), ...bigCity], extra);

  it('sanctions an uncovered Home from Easy', () => {
    expect(isWasteSanctioned(uncovered({ difficulty: 'easy' }), 10)).toBe(true);
  });

  it('expects no Waste handling from a city below the first facility unlock', () => {
    const small = city([home(10, 70, 48)], { difficulty: 'hard' });
    expect(wasteReport(small).required).toBe(false);
    expect(isWasteSanctioned(small, 10)).toBe(false);
    expect(isWasteMissing(small, 10)).toBe(false);
  });

  it('never sanctions under Cozy', () => {
    expect(isWasteSanctioned(uncovered({ difficulty: 'cozy' }), 10)).toBe(false);
  });

  it('does not sanction during an Adaptation period', () => {
    expect(isWasteSanctioned(uncovered({ difficulty: 'hard', adaptationUntil: 5 * H, lastSeen: 0 }), 10)).toBe(false);
  });

  it('does not sanction a covered Home', () => {
    expect(isWasteSanctioned(city([facility(1, 'mound', 66, 50), home(10, 64, 48), ...bigCity], { difficulty: 'hard' }), 10)).toBe(false);
  });
});

describe('Waste cost over time', () => {
  const buildings = [facility(1, 'mound', 66, 50), home(10, 64, 48, 2)];

  it('deducts the daily cost hour by hour as the clock advances', () => {
    const withMound = advance(city(buildings), 10 * H).state;
    const without = advance(city([buildings[1]!]), 10 * H).state;
    expect(without.urbs - withMound.urbs).toBeCloseTo(10 * wasteReport(city(buildings)).costPerHour, 6);
  });

  it('catches up an offline gap exactly as the same time played in steps', () => {
    const oneGo = advance(city(buildings), 6 * H).state;
    const steps = advance(advance(advance(city(buildings), 1 * H).state, 4 * H).state, 6 * H).state;
    expect(steps.urbs).toBeCloseTo(oneGo.urbs, 6);
  });

  it('stops paying once the Urbs are spent and never goes into debt', () => {
    const state = advance(city(buildings, { urbs: 0 }), 20 * H).state;
    expect(state.urbs).toBeGreaterThanOrEqual(0);
  });
});
