import { describe, expect, it } from 'vitest';
import { definitionOf } from '../buildings/buildingDefinitions';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type GameState } from '../index';
import { TICKETS, TAKINGS, advanceAttractions, earningsPerHour, attractionTakingsCapOf, takingsOf } from './takings';

const H = TAKINGS.hourMs;
const building = (id: number, type: Building['type'], extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, 10 * id, 10, 0), ...extra });
const city = (...buildings: Building[]): GameState => ({ ...newGame({ seed: 'takings', now: 0 }), nextId: 100, urbs: 0, tutorial: null, adaptationUntil: 0, lastSeen: 0, buildings });
const send = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  return result.ok ? null : result.error.key;
};
const ticketed = (level: number) => city(building(1, 'colosseum', { attraction: { ticket: level, takings: 0 } }));
const earned = (level: number) => advanceAttractions(ticketed(level), 0, 10 * H).buildings[0]!.attraction!.takings;

describe('Attraction Ticket and Takings', () => {
  it('accrues Takings over the hours', () => {
    const state = advanceAttractions(city(building(1, 'colosseum')), 0, 4 * H);
    expect(takingsOf(state.buildings[0]!)).toBeGreaterThan(0);
  });

  it('earns more per entry and draws fewer at a higher Ticket', () => {
    const rate = (level: number) => earningsPerHour({ ...building(1, 'colosseum'), attraction: { ticket: level, takings: 0 } }, 1, 1);
    expect(TICKETS[2].price).toBeGreaterThan(TICKETS[0].price);
    expect(TICKETS[2].draw).toBeLessThan(TICKETS[0].draw);
    expect(rate(2)).toBeGreaterThan(rate(0));
    expect(earned(2)).toBeGreaterThan(earned(0));
  });

  it('stops at the cap of the Tier', () => {
    const cap = attractionTakingsCapOf(building(1, 'colosseum'));
    const state = advanceAttractions(city(building(1, 'colosseum')), 0, 10_000 * H);
    expect(takingsOf(state.buildings[0]!)).toBe(cap);
  });

  it('collects the Takings by hand and keeps the fraction', () => {
    const state = city(building(1, 'colosseum', { attraction: { takings: 12.6 } }));
    const collected = send(state, { type: 'Collect', buildingId: 1 });
    expect(collected.urbs).toBe(12);
    expect(takingsOf(collected.buildings[0]!)).toBeCloseTo(0.6);
    expect(failure(collected, { type: 'Collect', buildingId: 1 })).toBe('error.nothingToCollect');
  });

  it('sets a valid Ticket level and refuses others', () => {
    const state = city(building(1, 'colosseum'));
    expect(send(state, { type: 'SetTicket', buildingId: 1, level: 2 }).buildings[0]!.attraction!.ticket).toBe(2);
    expect(failure(state, { type: 'SetTicket', buildingId: 1, level: 3 })).toBe('error.invalidPrice');
    expect(failure(city(building(1, 'home')), { type: 'SetTicket', buildingId: 1, level: 0 })).toBe('error.unknownCommand');
  });

  it('gives the same Takings in one step or many, as a catch-up replay does', () => {
    const start = city(building(1, 'colosseum'));
    const once = advance(start, 6 * H).state;
    const stepped = [1, 2, 3, 4, 5, 6].reduce((state, hour) => advance(state, hour * H).state, start);
    expect(takingsOf(stepped.buildings[0]!)).toBeCloseTo(takingsOf(once.buildings[0]!), 5);
  });

  it('earns nothing in an Arena with no Gathering, and keeps what it holds', () => {
    const hall = city(building(1, 'concertHall', { attraction: { takings: 12.6 } }));
    expect(takingsOf(advanceAttractions(hall, 0, 100 * H).buildings[0]!)).toBe(12.6);
    expect(earningsPerHour(building(1, 'concertHall'), 1, 1)).toBe(0);
  });

  it('lets the player collect and set the Ticket of an Arena', () => {
    const state = city(building(1, 'concertHall', { attraction: { takings: 12.6 } }));
    expect(takingsOf(send(state, { type: 'Collect', buildingId: 1 }).buildings[0]!)).toBeCloseTo(0.6);
    expect(send(state, { type: 'SetTicket', buildingId: 1, level: 2 }).buildings[0]!.attraction!.ticket).toBe(2);
  });

  it('refuses a Ticket on a building that sells none', () => {
    const state = city(building(1, 'hotel'));
    expect(() => send(state, { type: 'SetTicket', buildingId: 1, level: 2 })).toThrow('error.unknownCommand');
  });
});

describe('Attraction advance', () => {
  it('leaves a capped Attraction untouched', () => {
    const cap = attractionTakingsCapOf(building(1, 'colosseum'));
    const full = building(1, 'colosseum', { attraction: { takings: cap } });
    const state = city(full);
    expect(advanceAttractions(state, 0, H).buildings[0]).toBe(full);
  });

  it('pays back a mid-sized Attraction within days, not months', () => {
    const casino = building(1, 'casino');
    expect(definitionOf('casino').cost! / earningsPerHour(casino, 0.8, 1)).toBeLessThan(6 * TAKINGS.hoursPerDay);
  });
});
