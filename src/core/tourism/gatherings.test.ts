import { describe, expect, it } from 'vitest';
import { advance, createBuilding, dispatch, newGame, type Building, type Command, type GameState } from '../index';
import { artistOffer } from './artists';
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
const firstArtist = (state: GameState) => artistOffer(state, hall(state))[0]!.id;
const show = (state: GameState, startsInHours = 1): GameState => send(state, { type: 'ScheduleShow', buildingId: 1, startsInHours, artistId: firstArtist(state) });

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
    const star = { id: 'x', name: 'Star', kind: 'solo' as const, fame: 5 };
    const local = { ...star, fame: 1 };
    expect(previewGathering(state, hall(state), star).crowd).toBeGreaterThan(previewGathering(state, hall(state), local).crowd);
  });

  it('debits the cost when scheduled', () => {
    const state = city(1000);
    const artist = artistOffer(state, hall(state))[0]!;
    expect(show(state).urbs).toBe(1000 - previewGathering(state, hall(state), artist).cost);
    expect(previewGathering(state, hall(state), artist).cost).toBeGreaterThan(gatheringCostOf(hall(state)));
  });

  it('refuses a second Show while one is scheduled, and when the Urbs are short', () => {
    expect(failure(show(city()), { type: 'ScheduleShow', buildingId: 1, startsInHours: 5, artistId: 'artist-001' })).toBe('error.eventBusy');
    expect(failure(city(0), { type: 'ScheduleShow', buildingId: 1, startsInHours: 1, artistId: firstArtist(city(0)) })).toBe('error.notEnoughUrbs');
    expect(failure(city(), { type: 'ScheduleShow', buildingId: 2, startsInHours: 1 })).toBe('error.unknownCommand');
    expect(failure(city(), { type: 'ScheduleShow', buildingId: 1, startsInHours: 1 })).toBe('error.invalidArtist');
  });

  it('is active between its start and its end, then pays its revenue and starts the cooldown', () => {
    const scheduled = show(city(), 1);
    const gathering = hall(scheduled).attraction!.gathering!;
    expect(isGatheringActive(hall(scheduled), gathering.startsAt)).toBe(true);
    const done = advance(scheduled, gathering.endsAt + H).state;
    expect(hall(done).attraction?.gathering).toBeUndefined();
    expect(takingsOf(hall(done))).toBeGreaterThanOrEqual(gathering.revenue);
    expect(hall(done).attraction!.cooldownUntil).toBe(gathering.endsAt + GATHERING.cooldownMs);
    expect(failure({ ...done, lastSeen: gathering.endsAt + H }, { type: 'ScheduleShow', buildingId: 1, startsInHours: 1, artistId: 'artist-001' })).toBe('error.eventCooldown');
  });

  it('announces its start and its end once each', () => {
    const scheduled = show(city(), 1);
    const g = hall(scheduled).attraction!.gathering!;
    const events = (from: number, to: number) => advance(advance(scheduled, from).state, to).events.map(event => event.type);
    expect(events(0, g.startsAt + 1)).toContain('GatheringStarted');
    expect(events(g.startsAt + 1, g.endsAt + 1)).toContain('GatheringEnded');
    expect(events(g.startsAt + 1, g.endsAt - 1)).not.toContain('GatheringEnded');
  });

  it('counts the hours of a time skip for a scheduled Show', () => {
    const scheduled = show(city(), 5);
    const skipped = send(scheduled, { type: 'SkipTime', hours: 6 });
    expect(hall(skipped).attraction!.gathering?.startsAt ?? 0).toBeLessThan(hall(scheduled).attraction!.gathering!.startsAt);
    expect(skipped.buildings.length).toBe(scheduled.buildings.length);
  });

  it('survives a catch-up in one step as in many', () => {
    const scheduled = show(city(), 2);
    const once = advance(scheduled, 10 * H).state;
    const stepped = [2, 4, 6, 8, 10].reduce((state, hour) => advance(state, hour * H).state, scheduled);
    expect(hall(stepped).attraction!.cooldownUntil).toBe(hall(once).attraction!.cooldownUntil);
    expect(takingsOf(hall(stepped))).toBeCloseTo(takingsOf(hall(once)), 5);
  });
});
