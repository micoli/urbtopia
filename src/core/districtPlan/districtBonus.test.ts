import { describe, expect, it } from 'vitest';
import { createBuilding, homeBenefits, newGame, type Building, type GameState } from '../index';
import type { DistrictOffice } from './districtGame';
import { districtBonusOf, districtCapOf, districtRadiusOf, officeBonusOf } from './districtBonus';

const building = (id: number, type: Building['type'], x: number, y: number): Building => createBuilding(id, type, x, y, 0);
const city = (...buildings: Building[]): GameState => ({ ...newGame({ seed: 'district', now: 0 }), tutorial: null, adaptationUntil: 0, buildings });

// An office whose best game scored this much on a Deck of 24 Hexes: below 60 nothing, 60 Bronze, 84 Silver, 108 Gold.
const playedOffice = (id: number, x: number, y: number, score: number | undefined, tier = 1): Building => {
  const district: DistrictOffice = score === undefined ? { gameNumber: 0 } : { gameNumber: 1, best: { score, game: { number: 1, deckSize: 24, placements: [] } } };
  return { ...building(id, 'planningOffice', x, y), tier, district };
};

describe('the Well-being bonus of a Planning office', () => {
  it.each([
    { tier: 1, cap: 3, radius: 4 },
    { tier: 2, cap: 4, radius: 5 },
    { tier: 3, cap: 6, radius: 6 },
    { tier: 4, cap: 8, radius: 7 },
    { tier: 5, cap: 10, radius: 8 },
    { tier: 9, cap: 10, radius: 8 },
  ])('caps at $cap points over a radius of $radius tiles at Tier $tier', ({ tier, cap, radius }) => {
    expect(districtCapOf(tier)).toBe(cap);
    expect(districtRadiusOf(tier)).toBe(radius);
  });

  it.each([
    { score: 59, bonus: 0 },
    { score: 60, bonus: 1.2 },
    { score: 84, bonus: 2.1 },
    { score: 108, bonus: 3 },
    { score: 400, bonus: 3 },
  ])('is $bonus for a best score of $score at Tier 1', ({ score, bonus }) => {
    expect(officeBonusOf(playedOffice(1, 50, 50, score))).toBeCloseTo(bonus);
  });

  it('is 0 for an office that was never played, and for one that holds no state', () => {
    expect(officeBonusOf(playedOffice(1, 50, 50, undefined))).toBe(0);
    expect(officeBonusOf(building(1, 'planningOffice', 50, 50))).toBe(0);
  });

  it('follows the Tier of the office at once: the same score earns the new cap', () => {
    expect(officeBonusOf(playedOffice(1, 50, 50, 108, 1))).toBe(3);
    expect(officeBonusOf(playedOffice(1, 50, 50, 108, 3))).toBe(6);
  });

  it('reaches the Homes inside its radius and not the ones beyond it', () => {
    const office = playedOffice(1, 50, 50, 108);
    const near = building(2, 'home', 53, 51);
    const far = building(3, 'home', 50 + districtRadiusOf(1) + 40, 51);
    const state = city(office, near, far);
    expect(districtBonusOf(state, near)).toBe(3);
    expect(districtBonusOf(state, far)).toBe(0);
  });

  it('takes the best of the offices that reach a Home, never their sum', () => {
    const near = building(2, 'home', 53, 51);
    const gold = playedOffice(1, 50, 50, 108);
    const silver = playedOffice(4, 56, 50, 84);
    expect(districtBonusOf(city(gold, silver, near), near)).toBe(3);
    expect(districtBonusOf(city(silver, near), near)).toBeCloseTo(2.1);
  });

  it('is gone with the office that is demolished', () => {
    const near = building(2, 'home', 53, 51);
    expect(districtBonusOf(city(near), near)).toBe(0);
  });

  it('raises the Well-being of a Home in reach by its bonus', () => {
    const home = building(2, 'home', 53, 51);
    const withOffice = homeBenefits(city(playedOffice(1, 50, 50, 108), home), home).wellbeing;
    const without = homeBenefits(city(home), home).wellbeing;
    expect(withOffice - without).toBeCloseTo(3);
  });

  it('leaves the Well-being of a Home alone when the office was never played', () => {
    const home = building(2, 'home', 53, 51);
    expect(homeBenefits(city(playedOffice(1, 50, 50, undefined), home), home).wellbeing).toBe(homeBenefits(city(home), home).wellbeing);
  });
});
