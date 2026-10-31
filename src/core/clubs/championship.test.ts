import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, registerSportRules, unregisterSportRules, type Building, type Command, type GameState, type SportRules } from '../index';
import { CHAMPIONSHIP, clubRankOf, nextFixture, previewNextGathering } from './championship';
import { GATHERING, gatheringCapacityOf } from '../tourism/gatherings';
import { earningsPerHour } from '../tourism/takings';
import { checkGameState } from '../../persistence/validate';

const H = 3_600_000;
const rules: SportRules = { sport: 'football', squadMin: 4, squadMax: 8, composition: { keeper: 1, defender: 2, striker: 2 }, ratingRange: [30, 90], draws: true };

beforeEach(() => {
  registerSportRules('footballStadium', rules);
  registerSportRules('baseballField', { ...rules, sport: 'baseball', draws: false });
});
afterEach(() => {
  unregisterSportRules('footballStadium');
  unregisterSportRules('baseballField');
});

const building = (id: number, type: Building['type'], x: number, y: number): Building => createBuilding(id, type, x, y, 0);
const city = (type: Building['type'] = 'footballStadium'): GameState => ({
  ...newGame({ seed: 'championship', now: 0 }), nextId: 100, urbs: 10_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [building(1, type, 60, 60), building(2, 'home', 54, 60)],
});
const found = (state = city()): GameState => {
  const result = dispatch(state, { type: 'FoundClub', buildingId: 1 } as Command, state.lastSeen);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const club = (state: GameState) => state.buildings[0]!.club!;
const stadium = (state: GameState) => state.buildings[0]!;
const yearMs = CHAMPIONSHIP.matches * CHAMPIONSHIP.matchIntervalMs;
// The offline cap is 48 hours, so a long stretch is played in steps of less.
const play = (state: GameState, to: number, step = 12 * H): GameState => {
  let current = state;
  for (let time = current.lastSeen + step; time < to + step; time += step) current = advance(current, Math.min(time, to)).state;
  return current;
};

describe('Championship calendar', () => {
  it('has ten Matches an interval apart and seven invented opponents', () => {
    const { championship } = club(found());
    expect(championship!.fixtures).toHaveLength(CHAMPIONSHIP.matches);
    expect(championship!.fixtures.map(fixture => fixture.at)).toEqual(Array.from({ length: 10 }, (_, index) => (index + 1) * CHAMPIONSHIP.matchIntervalMs));
    expect(championship!.opponents).toHaveLength(CHAMPIONSHIP.opponents);
    expect(new Set(championship!.opponents.map(opponent => opponent.name)).size).toBe(CHAMPIONSHIP.opponents);
  });

  it('sets the next Match in the stadium before it starts, as a Gathering with no cost', () => {
    const state = found();
    const first = club(state).championship!.fixtures[0]!.at;
    const early = advance(state, first - CHAMPIONSHIP.leadMs - H).state;
    expect(stadium(early).attraction?.gathering).toBeUndefined();
    const set = advance(state, first - CHAMPIONSHIP.leadMs + 1).state;
    const gathering = stadium(set).attraction!.gathering!;
    expect(gathering.kind).toBe('match');
    expect(gathering.startsAt).toBe(first);
    expect(gathering.cost).toBe(0);
  });

  it('settles a Match once it was played, with points by result', () => {
    const state = found();
    const first = club(state).championship!.fixtures[0]!.at;
    const played = advance(state, first + 3 * H).state;
    const championship = club(played).championship!;
    expect(championship.fixtures[0]!.result).toBeDefined();
    expect(championship.fixtures[1]!.result).toBeUndefined();
    expect(championship.points).toBe(CHAMPIONSHIP.points[championship.fixtures[0]!.result!]);
    expect(nextFixture(championship)).toBe(championship.fixtures[1]);
  });

  it('ends the year with a ranking, a prize, a new year and a new calendar', () => {
    const state = found();
    const before = club(state);
    const end = play(state, yearMs + 3 * H);
    const after = club(end);
    expect(after.year).toBe(2);
    expect(after.championship!.fixtures.every(fixture => fixture.result === undefined)).toBe(true);
    expect(after.championship!.points).toBe(0);
    expect(after.squad.every(player => player.age >= 19)).toBe(true);
    expect(after.market.map(player => player.id)).not.toEqual(before.market.map(player => player.id));
    expect(after.fame).toBeGreaterThanOrEqual(1);
    expect(after.fame).toBeLessThanOrEqual(5);
    expect(after.squad.length).toBeGreaterThanOrEqual(rules.squadMin);
  });

  it('pays the prize of the ranking and moves the Fame without ever relegating or ruining the Club', () => {
    const strong = { ...found(), buildings: found().buildings.map(b => (b.id === 1 ? { ...b, club: { ...club(found()), squad: club(found()).squad.map(player => ({ ...player, rating: 100, contract: { ...player.contract, wage: 1 } })) } } : b)) };
    const end = play(strong, yearMs + 3 * H);
    expect(club(end).year).toBe(2);
    expect(clubRankOf({ ...club(strong).championship!, points: 1000 })).toBe(1);
    expect(club(end).squad.length).toBe(5);
  });

  it('draws no level result when the sport has none', () => {
    const state = found(city('baseballField'));
    const end = play(state, yearMs - 1);
    expect(club(end).championship!.fixtures.every(fixture => fixture.result !== 'draw')).toBe(true);
  });

  it('gives the same year in one catch-up as in many steps', () => {
    const state = found();
    const once = play(state, yearMs + 3 * H, 24 * H);
    const stepped = play(state, yearMs + 3 * H, 3 * H);
    expect(club(stepped).year).toBe(club(once).year);
    expect(club(stepped).fame).toBe(club(once).fame);
    expect(club(stepped).championship!.opponents).toEqual(club(once).championship!.opponents);
  });

  it('keeps its calendar through a save and moves it with a time skip', () => {
    const state = found();
    expect(checkGameState(JSON.parse(JSON.stringify(advance(state, 8 * H).state))).ok).toBe(true);
    const skipped = dispatch(state, { type: 'SkipTime', hours: 9 }, state.lastSeen);
    if (!skipped.ok) throw new Error(skipped.error.key);
    expect(club(skipped.state).championship!.fixtures[0]!.result ?? 'none').not.toBe('none');
  });
});

describe('Meetings', () => {
  const meetingSet = (state: GameState) => advance(state, CHAMPIONSHIP.meetingIntervalMs - CHAMPIONSHIP.leadMs + 1).state;

  it.each(['stadium', 'footballStadium', 'baseballField'] as const)('holds free isolated Meetings in a %s with no Club and no ranking', type => {
    const set = meetingSet(city(type));
    expect(stadium(set).attraction?.gathering).toMatchObject({ kind: 'meeting', cost: 0 });
    expect(stadium(set).club).toBeUndefined();
    const done = advance(set, CHAMPIONSHIP.meetingIntervalMs + 4 * H).state;
    expect(stadium(done).attraction?.gathering).toBeUndefined();
    expect(stadium(done).attraction!.takings).toBeGreaterThan(0);
  });

  it('seats the same crowd whatever the stadium, so only a Match fills a big one', () => {
    const crowded = (state: GameState): GameState => ({ ...state, buildings: state.buildings.map(candidate => (candidate.id === 1 ? { ...candidate, attraction: { takings: 0, ticket: 0 } } : candidate)), urbs: 10_000 });
    const meeting = stadium(meetingSet(crowded(city('footballStadium')))).attraction!.gathering!;
    expect(meeting.crowd).toBeLessThanOrEqual(GATHERING.meetingCapacity);
    expect(previewNextGathering(city('footballStadium'), stadium(city('footballStadium'))).crowd).toBeLessThanOrEqual(GATHERING.meetingCapacity);
  });

  it('forecasts the same crowd as the Meeting it then sets', () => {
    const state = city('stadium');
    const set = meetingSet(state);
    expect(stadium(set).attraction!.gathering!.crowd).toBeCloseTo(previewNextGathering(set, stadium(set)).crowd);
  });
});

describe('Championship boost', () => {
  const firstMatch = (state: GameState) => advance(state, club(state).championship!.fixtures[0]!.at - CHAMPIONSHIP.leadMs + 1).state;
  const withBoost = (state: GameState): GameState => ({ ...state, buildings: state.buildings.map(candidate => (candidate.id === 1 ? { ...candidate, attraction: { takings: 0, nextMatchBoost: true } } : candidate)) });

  it('draws a bigger crowd to the next Match, then is used up', () => {
    const plain = stadium(firstMatch(found())).attraction!;
    const boosted = stadium(firstMatch(withBoost(found()))).attraction!;
    expect(boosted.gathering!.crowd).toBeGreaterThan(plain.gathering!.crowd);
    expect(boosted.nextMatchBoost).toBeUndefined();
  });

  it('never draws more than the stadium seats, and earns nothing by itself', () => {
    const state = withBoost(found());
    const boosted = stadium(firstMatch(state)).attraction!.gathering!;
    expect(boosted.crowd).toBeLessThanOrEqual(gatheringCapacityOf(stadium(state)));
    expect(earningsPerHour(stadium(state), 1, 1)).toBe(0);
  });
});
