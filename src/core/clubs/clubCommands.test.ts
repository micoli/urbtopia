import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, registerSportRules, unregisterSportRules, type Building, type Command, type GameState, type SportRules } from '../index';
import { CLUB, wagesPerDay } from './club';
import { checkGameState } from '../../persistence/validate';

const rules: SportRules = { sport: 'football', squadMin: 4, squadMax: 8, composition: { keeper: 1, defender: 2, striker: 2 }, ratingRange: [30, 90], draws: true };
const H = 3_600_000;

beforeEach(() => registerSportRules('footballStadium', rules));
afterEach(() => unregisterSportRules('footballStadium'));

const stadium = (extra: Partial<Building> = {}): Building => ({ ...createBuilding(1, 'footballStadium', 60, 60, 0), ...extra });
const city = (...buildings: Building[]): GameState => ({ ...newGame({ seed: 'club-commands', now: 0 }), nextId: 100, urbs: 10_000, tutorial: null, adaptationUntil: 0, lastSeen: 0, buildings: buildings.length ? buildings : [stadium()] });
const send = (state: GameState, command: Command) => {
  const result = dispatch(state, command, state.lastSeen);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, state.lastSeen);
  return result.ok ? null : result.error.key;
};
const founded = () => send(city(), { type: 'FoundClub', buildingId: 1 });
const club = (state: GameState) => state.buildings[0]!.club!;

describe('Club commands', () => {
  it('founds a Club for a stadium with sport rules, once', () => {
    expect(club(founded()).squad).toHaveLength(5);
    expect(club(founded()).name).toMatch(/\S+ \S+/);
    expect(failure(founded(), { type: 'FoundClub', buildingId: 1 })).toBe('error.clubExists');
    expect(failure(city(createBuilding(1, 'home', 60, 60, 0)), { type: 'FoundClub', buildingId: 1 })).toBe('error.unknownCommand');
  });

  it('signs and releases players through the commands', () => {
    const state = founded();
    const target = club(state).market[0]!;
    const signed = send(state, { type: 'SignPlayer', buildingId: 1, playerId: target.id });
    expect(club(signed).squad).toHaveLength(6);
    const released = send(signed, { type: 'ReleasePlayer', buildingId: 1, playerId: target.id });
    expect(club(released).squad).toHaveLength(5);
    expect(failure(city(), { type: 'SignPlayer', buildingId: 1, playerId: 1 })).toBe('error.noClub');
    expect(failure(state, { type: 'SignPlayer', buildingId: 1, playerId: 9999 })).toBe('error.unknownPlayer');
  });

  it('pays the wages as time passes, the same in one step or many', () => {
    const state = founded();
    const once = advance(state, 10 * H).state;
    const stepped = [2, 4, 6, 8, 10].reduce((current, hour) => advance(current, hour * H).state, state);
    expect(club(once).budget).toBeCloseTo(club(state).budget - (wagesPerDay(club(state)) / 24) * 10);
    expect(club(stepped).budget).toBeCloseTo(club(once).budget, 5);
  });

  it('gets a share of what the stadium collects', () => {
    const state = city(stadium({ attraction: { takings: 100 } }));
    const withClub = send(state, { type: 'FoundClub', buildingId: 1 });
    const collected = send(withClub, { type: 'Collect', buildingId: 1 });
    expect(club(collected).budget - club(withClub).budget).toBe(Math.floor(100 * CLUB.takingsShare));
    expect(collected.urbs - withClub.urbs).toBe(100 - Math.floor(100 * CLUB.takingsShare));
  });

  it('keeps the Club through a save, and refuses one on a building without sport rules', () => {
    const state = founded();
    const check = checkGameState(JSON.parse(JSON.stringify(state)));
    expect(check.ok).toBe(true);
    const home = { ...state, buildings: [{ ...createBuilding(1, 'home', 60, 60, 0), club: club(state) }] };
    expect(checkGameState(home).ok).toBe(false);
  });
});
