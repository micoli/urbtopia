import { describe, expect, it } from 'vitest';
import { congestionStats, createBuilding, dispatch, homeBenefits, newGame, advance, type Building, type Command, type GameState } from '../index';
import { CROWD_WINDOW_MS, isCrowdMoving, movingGathering } from './gatheringWindow';
import { GATHERING_MALUS } from './gatheringMalus';
import { gatheringBoundaries } from './gatherings';
import { diagnoseCongestion } from '../traffic/diagnosis';

const H = CROWD_WINDOW_MS;
const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const base = (): GameState => ({
  ...newGame({ seed: 'peaks', now: 0 }), nextId: 100, urbs: 100_000, tutorial: null, adaptationUntil: 0, lastSeen: 0,
  buildings: [building(1, 'concertHall', 58, 59), building(2, 'home', 55, 59, { tier: 3 })],
});
const send = (state: GameState, command: Command) => {
  const result = dispatch(state, command, state.lastSeen);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const scheduled = () => send(base(), { type: 'ScheduleShow', buildingId: 1, startsInHours: 4 });
const at = (state: GameState, now: number): GameState => ({ ...state, lastSeen: now });
const load = (state: GameState) => [...congestionStats(state).sections.values()].reduce((sum, section) => sum + section.load, 0);
const gathering = () => scheduled().buildings[0]!.attraction!.gathering!;

describe('Gathering transport peaks', () => {
  it('moves the crowd from an hour before the start to an hour after the end, not outside', () => {
    const g = gathering();
    expect(isCrowdMoving(g, g.startsAt - H - 1)).toBe(false);
    expect(isCrowdMoving(g, g.startsAt - H)).toBe(true);
    expect(isCrowdMoving(g, g.endsAt + H - 1)).toBe(true);
    expect(isCrowdMoving(g, g.endsAt + H)).toBe(false);
    expect(movingGathering(scheduled().buildings[0]!, g.startsAt)).toBeDefined();
  });

  it('loads the roads only during the window', () => {
    const g = gathering();
    const state = scheduled();
    expect(load(at(state, g.startsAt - H - 1))).toBeLessThan(load(at(state, g.startsAt - H / 2)));
    expect(load(at(state, g.endsAt + H + 1))).toBeLessThan(load(at(state, g.endsAt + H / 2)));
    expect(load(at(state, g.endsAt + H + 1))).toBeCloseTo(load(at(state, g.startsAt - H - 1)));
  });

  it('lowers the Well-being of the Homes in reach during the window, and not otherwise', () => {
    const g = gathering();
    const state = scheduled();
    const home = (s: GameState) => s.buildings.find(b => b.id === 2)!;
    const wellbeing = (s: GameState) => homeBenefits(s, home(s)).wellbeing;
    const quiet = wellbeing(at(state, g.startsAt - H - 1));
    const peak = wellbeing(at(state, g.startsAt));
    expect(peak).toBeLessThan(quiet);
    expect(quiet - peak).toBeLessThanOrEqual(GATHERING_MALUS + 1);
    expect(wellbeing(at(state, g.endsAt + H + 1))).toBeCloseTo(quiet);
  });

  it('never removes Tourists: the crowd is the same however poor the service', () => {
    expect(gathering().tourists).toBeGreaterThan(0);
    const served = send({ ...base(), buildings: [...base().buildings, building(3, 'railStation', 62, 59)] }, { type: 'ScheduleShow', buildingId: 1, startsInHours: 4 });
    expect(served.buildings[0]!.attraction!.gathering!.tourists).toBeCloseTo(gathering().tourists);
  });

  it('stops the simulation at each moment the crowd starts or stops moving', () => {
    const g = gathering();
    expect(gatheringBoundaries(scheduled(), 0)).toEqual([g.startsAt - H, g.startsAt, g.endsAt, g.endsAt + H]);
    const done = advance(scheduled(), g.endsAt + H + 1).state;
    expect(done.buildings[0]!.attraction?.gathering).toBeUndefined();
  });

  it('names the Gathering as a Cause of Congestion while its crowd drives on a saturated road', () => {
    const g = gathering();
    const state = at(scheduled(), g.startsAt);
    const stats = congestionStats(state);
    const jammed = { ...stats, sections: new Map([['58,58', { tile: { x: 58, y: 58 }, load: 50, capacity: 5, ratio: 10 }]]) };
    expect(diagnoseCongestion(state, jammed, { lines: [] }).causes.map(cause => cause.key)).toContain('diagnosis.congestion.gathering');
    const quiet = at(scheduled(), g.endsAt + 2 * H);
    expect(diagnoseCongestion(quiet, { ...congestionStats(quiet), sections: jammed.sections }, { lines: [] }).causes.map(cause => cause.key)).not.toContain('diagnosis.congestion.gathering');
  });
});
