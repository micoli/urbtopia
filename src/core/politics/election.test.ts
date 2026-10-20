import { describe, expect, it } from 'vitest';
import { advance, councilForecast, FACTION_IDS, holdElection, isPoliticsActive, mandateOf, POLITICS, termDaysLeft, type GameState } from '../index';
import { DAY, politicalCity } from './testSupport';

const seatTotal = (seats: Record<string, number>) => Object.values(seats).reduce((sum, count) => sum + count, 0);

const playDays = (state: GameState, days: number): GameState => {
  let current = state;
  for (let day = 0; day < days; day++) current = advance(current, current.lastSeen + DAY).state;
  return current;
};

describe('Mandate', () => {
  it('is neutral at an Approval of 50 and spans -1 to 1', () => {
    expect(mandateOf(50)).toBe(0);
    expect(mandateOf(0)).toBe(-1);
    expect(mandateOf(100)).toBe(1);
  });
});

describe('Holding an Election', () => {
  const politics = politicalCity('medium').politics!;

  it('keeps a balanced Council for a Mayor the city likes', () => {
    const result = holdElection(politics, 100, 12);
    expect(result.seats).toEqual(POLITICS.council.seats);
    expect(result.mandate).toBe(1);
  });

  it('keeps a balanced Council at a neutral Approval', () => {
    expect(holdElection(politics, 50, 12).seats).toEqual(POLITICS.council.seats);
  });

  it('moves seats from one Faction to another for a Mayor the city dislikes', () => {
    const result = holdElection(politics, 0, 12);
    expect(result.mandate).toBe(-1);
    expect(result.seats).not.toEqual(POLITICS.council.seats);
    expect(seatTotal(result.seats)).toBe(seatTotal(POLITICS.council.seats));
    for (const faction of FACTION_IDS) expect(result.seats[faction]).toBeGreaterThanOrEqual(1);
  });

  it('moves more seats the lower the Approval', () => {
    const moved = (approval: number) => FACTION_IDS.reduce((sum, faction) => sum + Math.abs(holdElection(politics, approval, 12).seats[faction] - POLITICS.council.seats[faction]), 0) / 2;
    expect(moved(25)).toBe(1);
    expect(moved(0)).toBe(2);
  });

  it('starts the next Term on the day of the Election', () => {
    const result = holdElection(politics, 40, 12);
    expect(result.term).toEqual({ startDay: 12, number: politics.term.number + 1 });
    expect(result.lastElection).toEqual({ day: 12, approval: 40, mandate: mandateOf(40), seats: result.seats });
  });

  it('draws from the politics stream, and always the same way', () => {
    expect(holdElection(politics, 0, 12)).toEqual(holdElection(politics, 0, 12));
    expect(holdElection(politics, 0, 12).rngState).not.toBe(politics.rngState);
  });
});

describe('Term', () => {
  it('has an Election at its end from Medium', () => {
    const city = politicalCity('medium');
    const start = city.politics!.term.startDay;
    const before = playDays(city, POLITICS.term.days - 1);
    expect(before.politics!.term.number).toBe(1);
    expect(before.politics!.lastElection).toBeUndefined();
    const after = playDays(before, 1);
    expect(after.politics!.term.number).toBe(2);
    expect(after.politics!.lastElection!.day).toBe(start + POLITICS.term.days);
    expect(seatTotal(after.politics!.seats)).toBe(seatTotal(POLITICS.council.seats));
  });

  it('counts the days left', () => {
    const city = politicalCity('medium');
    expect(termDaysLeft(city.politics!, city.politics!.day)).toBe(POLITICS.term.days);
    const later = playDays(city, 3);
    expect(termDaysLeft(later.politics!, later.politics!.day)).toBe(POLITICS.term.days - 3);
  });

  it('has no Election under Easy', () => {
    const played = playDays(politicalCity('easy'), POLITICS.term.days + 2);
    expect(played.politics!.term.number).toBe(1);
    expect(played.politics!.lastElection).toBeUndefined();
    expect(played.politics!.mandate).toBe(0);
  });

  it('never takes the city from the Mayor, whatever the Approval', () => {
    const city = politicalCity('hard');
    const hated = { ...city, politics: { ...city.politics!, approval: 0, shock: -100 } };
    const played = playDays(hated, POLITICS.term.days + 1);
    expect(played.politics!.term.number).toBeGreaterThan(1);
    expect(isPoliticsActive(played)).toBe(true);
    expect(played.buildings.length).toBe(hated.buildings.length);
    expect(played.politics!.approval).toBeGreaterThanOrEqual(0);
  });

  it('gives the same Election after a reload', () => {
    const city = politicalCity('medium');
    const halfway = playDays(city, 5);
    const straight = playDays(halfway, POLITICS.term.days - 4);
    const reloaded = playDays(JSON.parse(JSON.stringify(halfway)) as GameState, POLITICS.term.days - 4);
    expect(reloaded.politics).toEqual(straight.politics);
  });
});

describe('Council goodwill', () => {
  const elected = (difficulty: 'medium' | 'hard', mandate: number): GameState => {
    const city = politicalCity(difficulty);
    return { ...city, politics: { ...city.politics!, mandate, approval: 50, shock: 0 } };
  };

  it('is not swayed on Easy', () => {
    const easy = politicalCity('easy');
    expect(councilForecast({ ...easy, politics: { ...easy.politics!, mandate: -1 } }, 'transitSubsidy').passes).toBe(true);
  });

  it('votes with the mandate of the last Election from Medium', () => {
    expect(councilForecast(elected('medium', -1), 'transitSubsidy').passes).toBe(false);
    expect(councilForecast(elected('medium', 1), 'greenBelt').passes).toBe(true);
    expect(councilForecast(elected('medium', 0), 'greenBelt').passes).toBe(false);
  });

  it('adds the live Approval on top on Hard', () => {
    const hard = elected('hard', 0.5);
    const liked = { ...hard, politics: { ...hard.politics!, approval: 100 } };
    expect(councilForecast(liked, 'officeRelief').votes.map(vote => vote.vote)).toEqual(councilForecast(elected('hard', 1), 'officeRelief').votes.map(vote => vote.vote));
  });
});
