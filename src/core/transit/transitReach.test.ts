import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { createBuilding, newGame, serviceCoverage, transitReachLinks, TRANSIT_REACH, type Building, type GameState, type TransitTile } from '../index';

const walkingEnabled = WALKING.enabled;
beforeAll(() => { WALKING.enabled = false; });
afterAll(() => { WALKING.enabled = walkingEnabled; });

const strip = (x: number, y: number, length: number): TransitTile[] => Array.from({ length }, (_, i) => ({ x: x + i, y, exits: i === 0 ? ['E'] : i === length - 1 ? ['W'] : ['W', 'E'] }));

const SCHOOL = 1, HOME = 2, STATION_A = 3, STATION_B = 4;

function brtCity(extra: Partial<GameState> = {}, buildings: Building[] = []): GameState {
  return { ...newGame({ seed: 'transit-reach', now: 0 }), urbs: 100_000, nextId: 100, adaptationUntil: 0, tutorial: null, roundabouts: [], brtRoads: strip(0, 0, 45),
    buildings: [
      createBuilding(SCHOOL, 'school', 3, 3, 0), { ...createBuilding(HOME, 'home', 40, 3, 0), tier: 2 },
      createBuilding(STATION_A, 'brtStation', 3, 1, 0), createBuilding(STATION_B, 'brtStation', 40, 1, 0), ...buildings,
    ],
    transitLines: [{ id: 10, mode: 'brt', stops: [STATION_A, STATION_B], peakHeadway: 5, offPeakHeadway: 10 }],
    transitFleet: [{ id: 11, kind: 'brtElectric', purchasePrice: 900, lineId: 10 }], ...extra };
}

const covers = (state: GameState, type: Building['type'], homeId = HOME) => serviceCoverage(state).get(homeId)?.has(type as never) ?? false;

describe('Transit reach', () => {
  it('leaves a distant Home uncovered without a line', () => {
    expect(covers(brtCity({ transitLines: [], transitFleet: [] }), 'school')).toBe(false);
  });

  it('covers a distant Home that a BRT line brings within the travel time', () => {
    const state = brtCity();
    expect(covers(state, 'school')).toBe(true);
    const link = transitReachLinks(state).get(HOME)?.get('school');
    expect(link).toMatchObject({ facilityId: SCHOOL, facilityStopId: STATION_A, homeStopId: STATION_B });
    expect(link!.minutes).toBeLessThanOrEqual(TRANSIT_REACH.maxMinutes);
  });

  it('does not report a Home in direct reach as covered through transit', () => {
    const state = brtCity({}, [{ ...createBuilding(20, 'home', 8, 8, 0), tier: 2 }]);
    expect(covers(state, 'school', 20)).toBe(true);
    expect(transitReachLinks(state).get(20)).toBeUndefined();
  });

  it('does not extend reach through ordinary Bus stops', () => {
    expect(covers(brtCity({ transitLines: [], transitFleet: [], busLines: [{ id: 12, stops: [STATION_A, STATION_B] }] }), 'school')).toBe(false);
  });

  it('needs a vehicle assigned to the line', () => {
    expect(covers(brtCity({ transitFleet: [] }), 'school')).toBe(false);
  });

  it('stops covering when the route is cut', () => {
    expect(covers(brtCity({ brtRoads: strip(0, 0, 20) }), 'school')).toBe(false);
  });

  it('does not cover a Home beyond the travel time', () => {
    const slow = [{ id: 10, mode: 'brt' as const, stops: [STATION_A, STATION_B], peakHeadway: 5, offPeakHeadway: 60 }];
    expect(covers(brtCity({ transitLines: slow }), 'school')).toBe(false);
  });

  it('needs the Home to be near a stop', () => {
    const state = brtCity({}, [{ ...createBuilding(21, 'home', 40, 20, 0), tier: 2 }]);
    expect(covers(state, 'school', 21)).toBe(false);
  });

  it('does not extend Waste coverage', () => {
    const state = brtCity({}, [createBuilding(22, 'mound', 3, 8, 0)]);
    expect(covers(state, 'mound')).toBe(false);
  });

  it('extends the other Service categories', () => {
    expect(covers(brtCity({}, [createBuilding(28, 'hospital', 0, 3, 0)]), 'hospital')).toBe(true);
  });

  it('serves Homes in direct reach before Homes reached by transit', () => {
    const direct = { ...createBuilding(23, 'home', 8, 8, 0), tier: 8 };
    const state = brtCity({}, [direct]);
    expect(covers(state, 'school', 23)).toBe(true);
    expect(covers(state, 'school', HOME)).toBe(false);
  });
});
