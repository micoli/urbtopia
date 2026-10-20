import { describe, expect, it } from 'vitest';
import { advance, approvalOf, cityBenefits, newGame, POLITICS, totalCitizens, withApprovalShock, type Difficulty, type GameState } from '../index';
import { createBuilding } from '../buildings/buildingSpecs';

const DAY = POLITICS.dayHours * 3_600_000;
// An hour past a game day boundary, so the tests count whole days from there.
const T0 = Math.ceil(1_700_000_000_000 / DAY) * DAY + 3_600_000;

function politicalCity(difficulty: Difficulty = 'easy'): GameState {
  const city = newGame({ seed: 'amber-fox-4821', now: T0, difficulty });
  const withHall = { ...city, nextId: city.nextId + 2, buildings: [...city.buildings, createBuilding(city.nextId, 'townHall', 8, 8, 0), createBuilding(city.nextId + 1, 'home', 4, 4, 0)] };
  return advance(withHall, T0).state;
}

const withApproval = (state: GameState, approval: number, shock = 0): GameState => ({ ...state, politics: { ...state.politics!, approval, shock } });

describe('Approval', () => {
  it('has no value without politics', () => {
    expect(approvalOf(newGame({ seed: 'amber-fox-4821', now: T0 }))).toBeNull();
  });

  it('starts at the initial value', () => {
    expect(approvalOf(politicalCity())).toBe(POLITICS.approval.initial);
  });

  it('does not move within a game day', () => {
    const city = politicalCity();
    expect(approvalOf(advance(city, T0 + DAY / 2).state)).toBe(POLITICS.approval.initial);
  });

  it('moves toward the Citizen-weighted mean Well-being each game day', () => {
    const city = withApproval(politicalCity(), 0);
    expect(totalCitizens(city)).toBeGreaterThan(0);
    const target = cityBenefits(city).wellbeing;
    const next = advance(city, T0 + DAY).state;
    expect(approvalOf(next)).toBeCloseTo(target * POLITICS.approval.dailyConvergence, 5);
  });

  it('moves down toward a lower target', () => {
    const city = withApproval(politicalCity(), 100);
    const target = cityBenefits(city).wellbeing;
    expect(target).toBeLessThan(100);
    expect(approvalOf(advance(city, T0 + DAY).state)).toBeLessThan(100);
  });

  it('stays between 0 and 100', () => {
    for (const start of [0, 100]) {
      const approval = approvalOf(advance(withApproval(politicalCity(), start), T0 + 40 * 3_600_000).state)!;
      expect(approval).toBeGreaterThanOrEqual(0);
      expect(approval).toBeLessThanOrEqual(100);
    }
  });

  it('adds a one-off shock that fades day after day', () => {
    const city = withApprovalShock(politicalCity(), 10);
    expect(approvalOf(city)).toBe(POLITICS.approval.initial + 10);
    const later = advance(city, T0 + DAY).state;
    expect(later.politics!.shock).toBeCloseTo(10 * (1 - POLITICS.approval.shockFadePerDay), 5);
    const muchLater = advance(city, T0 + 2 * DAY).state;
    expect(muchLater.politics!.shock).toBeLessThan(later.politics!.shock);
  });

  it('is clamped when a shock overshoots', () => {
    expect(approvalOf(withApprovalShock(politicalCity(), 500))).toBe(100);
    expect(approvalOf(withApprovalShock(politicalCity(), -500))).toBe(0);
  });

  it('gives the same result whether played in one go or in steps', () => {
    const city = politicalCity();
    const oneGo = advance(city, T0 + 2 * DAY).state;
    const steps = advance(advance(city, T0 + DAY / 2).state, T0 + 2 * DAY).state;
    expect(steps.politics).toEqual(oneGo.politics);
  });

  it('never changes the Urbs earned by Tax or the Sanctions', () => {
    const low = advance(withApproval(politicalCity('medium'), 0), T0 + DAY / 2).state;
    const high = advance(withApproval(politicalCity('medium'), 100), T0 + DAY / 2).state;
    expect(low.urbs).toBe(high.urbs);
    expect(low.storage).toEqual(high.storage);
  });
});
