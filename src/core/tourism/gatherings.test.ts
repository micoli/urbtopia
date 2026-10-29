import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type GameState } from '../index';
import { GATHERING, gatheringCapacityOf, gatheringCostOf, isGatheringActive, previewGathering } from './gatherings';
import { TAKINGS, takingsOf } from './takings';

const H = TAKINGS.hourMs;
const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (urbs = 100_000, ...extra: Building[]): GameState => ({
  ...newGame({ seed: 'gatherings', now: 0 }), nextId: 100, urbs, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [building(1, 'concertHall', 60, 60), building(2, 'home', 56, 60, { tier: 3 }), ...extra],
});
const send = (state: GameState, command: Command) => {
  const result = dispatch(state, command, state.lastSeen);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, state.lastSeen);
  return result.ok ? null : result.error.key;
};
const hall = (state: GameState) => state.buildings.find(b => b.id === 1)!;
const show = (state: GameState, startsInHours = 1): GameState => send(state, { type: 'ScheduleShow', buildingId: 1, startsInHours });

describe('Gathering: Shows', () => {
  it('draws a crowd of Tourists and Citizens in reach, within the capacity', () => {
    const preview = previewGathering(city(), hall(city()));
    expect(preview.crowd).toBeGreaterThan(0);
    expect(preview.crowd).toBeLessThanOrEqual(gatheringCapacityOf(hall(city())));
    expect(preview.tourists + preview.citizens).toBeCloseTo(preview.crowd);
    expect(preview.citizens).toBeGreaterThan(0);
  });

  it('draws a bigger crowd for a better Show', () => {
    const state = city();
    expect(previewGathering(state, hall(state), 1).crowd).toBeGreaterThan(previewGathering(state, hall(state), 0).crowd);
  });

  it('debits the cost when scheduled', () => {
    const state = city(1000);
    expect(show(state).urbs).toBe(1000 - gatheringCostOf(hall(state)));
  });

  it('refuses a second Show while one is scheduled, and when the Urbs are short', () => {
    expect(failure(show(city()), { type: 'ScheduleShow', buildingId: 1, startsInHours: 5 })).toBe('error.eventBusy');
    expect(failure(city(0), { type: 'ScheduleShow', buildingId: 1, startsInHours: 1 })).toBe('error.notEnoughUrbs');
    expect(failure(city(), { type: 'ScheduleShow', buildingId: 2, startsInHours: 1 })).toBe('error.unknownCommand');
  });

  it('is active between its start and its end, then pays its revenue and starts the cooldown', () => {
    const scheduled = show(city(), 1);
    const gathering = hall(scheduled).attraction!.gathering!;
    expect(isGatheringActive(hall(scheduled), gathering.startsAt)).toBe(true);
    const done = advance(scheduled, gathering.endsAt + H).state;
    expect(hall(done).attraction?.gathering).toBeUndefined();
    expect(takingsOf(hall(done))).toBeGreaterThanOrEqual(gathering.revenue);
    expect(hall(done).attraction!.cooldownUntil).toBe(gathering.endsAt + GATHERING.cooldownMs);
    expect(failure({ ...done, lastSeen: gathering.endsAt + H }, { type: 'ScheduleShow', buildingId: 1, startsInHours: 1 })).toBe('error.eventCooldown');
  });

  it('survives a catch-up in one step as in many', () => {
    const scheduled = show(city(), 2);
    const once = advance(scheduled, 10 * H).state;
    const stepped = [2, 4, 6, 8, 10].reduce((state, hour) => advance(state, hour * H).state, scheduled);
    expect(hall(stepped).attraction!.cooldownUntil).toBe(hall(once).attraction!.cooldownUntil);
    expect(takingsOf(hall(stepped))).toBeCloseTo(takingsOf(hall(once)), 5);
  });
});
