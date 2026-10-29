import { describe, expect, it } from 'vitest';
import { CLUB, advanceClub, createClub, marketValueOf, refreshMarket, releasePlayer, severanceOf, signPlayer, signingFeeOf, wageOf, wagesPerDay } from './club';
import type { ClubData, SportRules } from './clubTypes';

const rules: SportRules = { sport: 'football', squadMin: 4, squadMax: 8, composition: { keeper: 1, defender: 2, striker: 2 }, ratingRange: [30, 90] };
const club = (): ClubData => createClub(rules, 'Harbour Herons', 'seed');

describe('Club', () => {
  it('founds the same Club from the same seed, with the Squad the sport asks for', () => {
    expect(club()).toEqual(club());
    const founded = club();
    expect(founded.squad).toHaveLength(5);
    expect(founded.squad.filter(player => player.position === 'defender')).toHaveLength(2);
    expect(founded.market).toHaveLength(CLUB.marketSize);
    expect(new Set([...founded.squad, ...founded.market].map(player => player.id)).size).toBe(5 + CLUB.marketSize);
    expect(createClub(rules, 'x', 'other').squad.map(player => player.name)).not.toEqual(founded.squad.map(player => player.name));
  });

  it('draws individuals with a rating in range, an age and a contract', () => {
    for (const player of club().squad) {
      expect(player.rating).toBeGreaterThanOrEqual(30);
      expect(player.rating).toBeLessThanOrEqual(90);
      expect(player.contract.wage).toBe(wageOf(player.rating));
      expect(player.contract.untilYear).toBe(CLUB.contractYears);
      expect(player.history).toEqual([]);
    }
  });

  it('signs a player from the market for his fee, and refuses when the budget or the Squad is short', () => {
    const founded = club();
    const target = founded.market[0]!;
    const signed = signPlayer(rules, founded, target.id) as { club: ClubData };
    expect(signed.club.squad).toContainEqual(expect.objectContaining({ id: target.id }));
    expect(signed.club.budget).toBe(founded.budget - signingFeeOf(target));
    expect(signed.club.market.some(player => player.id === target.id)).toBe(false);
    expect(signPlayer(rules, { ...founded, budget: 0 }, target.id)).toEqual({ error: 'error.notEnoughBudget' });
    expect(signPlayer({ ...rules, squadMax: 5 }, founded, target.id)).toEqual({ error: 'error.squadFull' });
    expect(signPlayer(rules, founded, 9999)).toEqual({ error: 'error.unknownPlayer' });
  });

  it('releases a player for severance, but never below the minimum Squad', () => {
    const founded = club();
    const leaving = founded.squad[0]!;
    const released = releasePlayer(rules, founded, leaving.id) as { club: ClubData };
    expect(released.club.squad).toHaveLength(4);
    expect(released.club.budget).toBe(founded.budget - severanceOf(leaving));
    expect(releasePlayer(rules, released.club, released.club.squad[0]!.id)).toEqual({ error: 'error.squadTooSmall' });
  });

  it('pays the wages by the hour', () => {
    const founded = club();
    expect(advanceClub(rules, founded, 24).budget).toBeCloseTo(founded.budget - wagesPerDay(founded));
    expect(advanceClub(rules, founded, 0)).toBe(founded);
  });

  it('sells its best players when in debt, down to the minimum Squad, and never goes bankrupt', () => {
    const broke = { ...club(), budget: -1 };
    const best = [...broke.squad].sort((a, b) => b.rating - a.rating)[0]!;
    const after = advanceClub(rules, broke, 1);
    expect(after.squad.some(player => player.id === best.id)).toBe(false);
    expect(after.budget).toBeGreaterThanOrEqual(0);
    const ruined = advanceClub(rules, { ...club(), budget: -1_000_000 }, 1);
    expect(ruined.squad).toHaveLength(rules.squadMin);
    expect(ruined.budget).toBe(CLUB.debtLimit);
  });

  it('makes a young player worth more than an old one of the same rating', () => {
    expect(marketValueOf({ rating: 70, age: 20 })).toBeGreaterThan(marketValueOf({ rating: 70, age: 33 }));
  });

  it('replaces the market with new players', () => {
    const founded = club();
    const next = refreshMarket(rules, founded);
    expect(next.market).toHaveLength(CLUB.marketSize);
    expect(next.market.map(player => player.id)).not.toEqual(founded.market.map(player => player.id));
    expect(next.squad).toBe(founded.squad);
  });
});
