import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { advance, dispatch, energyStats, newGame, productionFactors, totalCitizens, utilityCapacity, utilityDemand, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function failureKey(state: GameState, command: Command, now = T0): string | null {
  const result = dispatch(state, command, now);
  return result.ok ? null : result.error.key;
}

const place = (buildingType: 'home' | 'powerPlant' | 'waterTower', x: number, y: number): Command => ({ type: 'PlaceBuilding', buildingType, x, y });
const initial = newGame({ seed: 'amber-fox-4821', now: T0 });
const powered = succeed(succeed({ ...initial, urbs: 10_000 }, place('powerPlant', 70, 70)), place('waterTower', 72, 70));
const withHome = succeed(powered, place('home', 56, 57));
const HOME_ID = withHome.buildings.find((b) => b.type === 'home')?.id ?? 0;

describe('utilities', () => {
  it('gives current wind output and a global water pool', () => {
    expect(utilityCapacity(powered)).toEqual({ power: 12 * productionFactors(powered.lastSeen).wind, water: 12 });
    expect(utilityCapacity(initial)).toEqual({ power: 0, water: 0 });
  });

  it('includes economic demand and Homes according to their Tier', () => {
    expect(utilityDemand(initial)).toEqual({ power: 3, water: 0 });
    expect(utilityDemand(withHome)).toEqual({ power: 4, water: 1 });
    expect(totalCitizens(withHome)).toBe(6);
  });
});

describe('Home placement', () => {
  it('pays for the first Home, Power plant and Water tower with exactly the 600 starting Urbs', () => {
    let state = initial;
    state = succeed(state, place('powerPlant', 70, 70));
    state = succeed(state, place('waterTower', 72, 70));
    state = succeed(state, place('home', 56, 57));
    expect(state.urbs).toBe(0);
  });

  it('requires water and allows an electricity deficit', () => {
    const onlyWater = succeed({ ...initial, urbs: 10_000 }, place('waterTower', 72, 70));
    const unpoweredHome = succeed(onlyWater, place('home', 56, 57));
    expect(utilityCapacity(unpoweredHome).power).toBe(0);
    expect(energyStats(unpoweredHome).unmet).toBe(4);
    const onlyPower = succeed({ ...initial, urbs: 10_000 }, place('powerPlant', 70, 70));
    expect(failureKey(onlyPower, place('home', 56, 57))).toBe('error.notEnoughWater');
  });

  it('is refused once water Demand would exceed Capacity', () => {
    const full: GameState = { ...powered };
    let state = full;
    const spots = [...Array.from({ length: 10 }, (_, index) => [53 + index, 59]), [56, 57], [57, 57]];
    for (const [x, y] of spots) state = succeed(state, place('home', x ?? 0, y ?? 0));
    expect(utilityDemand(state)).toEqual({ power: 15, water: 12 });
    expect(utilityDemand(state).power).toBeGreaterThan(utilityCapacity(state).power);
    expect(failureKey(state, place('home', 58, 57))).toBe('error.notEnoughWater');
  });
});

describe('selling utilities', () => {
  it('allows selling the last plant but preserves water supply', () => {
    const plant = withHome.buildings.find((b) => b.type === 'powerPlant');
    const secondPlant = succeed(withHome, place('powerPlant', 74, 70));
    expect(failureKey(secondPlant, { type: 'SellBuilding', id: plant?.id ?? 0 })).toBeNull();
    const lonely: GameState = { ...withHome };
    const sold = succeed(lonely, { type: 'SellBuilding', id: plant?.id ?? 0 });
    expect(utilityCapacity(sold).power).toBe(0);
    expect(energyStats(sold).unmet).toBe(4);
    const tower = lonely.buildings.find((b) => b.type === 'waterTower');
    expect(failureKey(lonely, { type: 'SellBuilding', id: tower?.id ?? 0 })).toBe('error.utilityInUse');
  });

  it('is allowed when nothing is in use, and moving keeps the Capacity', () => {
    const plant = powered.buildings.find((b) => b.type === 'powerPlant');
    expect(failureKey(powered, { type: 'SellBuilding', id: plant?.id ?? 0 })).toBeNull();
    const moved = succeed(withHome, { type: 'MoveBuilding', id: plant?.id ?? 0, x: 74, y: 70 });
    expect(utilityCapacity(moved)).toEqual(utilityCapacity(withHome));
  });
});

describe('Tax', () => {
  it('gives 1 Urb per Citizen per hour, collected by hand', () => {
    const later = advance(withHome, T0 + HOUR).state;
    const collected = succeed(later, { type: 'Collect', buildingId: HOME_ID }, T0 + HOUR);
    expect(collected.urbs - withHome.urbs).toBe(6);
  });

  it('keeps the part of an Urb that is not due yet', () => {
    const later = succeed(advance(withHome, T0 + HOUR / 4).state, { type: 'Collect', buildingId: HOME_ID }, T0 + HOUR / 4);
    expect(later.urbs - withHome.urbs).toBe(1);
    const next = succeed(advance(later, T0 + HOUR / 2).state, { type: 'Collect', buildingId: HOME_ID }, T0 + HOUR / 2);
    expect(next.urbs - later.urbs).toBe(2);
  });

  it('stops accumulating after 8 hours', () => {
    const later = advance(withHome, T0 + 30 * HOUR).state;
    const collected = succeed(later, { type: 'Collect', buildingId: HOME_ID }, T0 + 30 * HOUR);
    expect(collected.urbs - withHome.urbs).toBe(48);
  });

  it('refuses to collect when nothing is due', () => {
    expect(failureKey(withHome, { type: 'Collect', buildingId: HOME_ID })).toBe('error.nothingToCollect');
  });

  it('gives the same state whether time is advanced in steps or at once', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 20 * HOUR }), fc.integer({ min: 0, max: 20 * HOUR }), (a, b) => {
        const [first, second] = [T0 + Math.min(a, b), T0 + Math.max(a, b)];
        expect(advance(advance(withHome, first).state, second).state).toEqual(advance(withHome, second).state);
      }),
    );
  });
});
