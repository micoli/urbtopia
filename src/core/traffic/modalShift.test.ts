import { describe, expect, it } from 'vitest';
import { SHIFT, citizensOf, cityTransportStats, congestionStats, createBuilding, newGame, transportStats, type Building, type GameState } from '../index';

const HOME_TIER = 7;
const homeCitizens = citizensOf(HOME_TIER);
const start = newGame({ seed: 'modal-shift', now: 0 });
const workplaces = start.buildings.map((building) => ({ ...building, tier: 8 }));

function city(homeCount: number, lineCount: number): GameState {
  const homes: Building[] = Array.from({ length: homeCount }, (_, index) => ({ ...createBuilding(40 + index, 'home', 53 + 2 * index, 59, 0), tier: HOME_TIER }));
  const stops = [createBuilding(60, 'busStop', 59, 59, 0), createBuilding(61, 'busStop', 61, 59, 0)];
  return {
    ...start,
    adaptationUntil: 0,
    nextId: 100,
    buildings: [...workplaces, ...homes, ...stops],
    busLines: Array.from({ length: lineCount }, (_, index) => ({ id: 20 + index, stops: [60, 61] })),
  };
}



describe('modal shift', () => {
  it('moves Commuters of a saturated road onto lines with spare capacity', () => {
    const state = city(3, 5);
    const stats = congestionStats(state);
    const base = transportStats(state);
    expect(stats.shift.total).toBeGreaterThan(0);
    expect(stats.commuters).toBeCloseTo(3 * homeCitizens - base.riders - stats.shift.total);
  });

  it('counts the shifted Riders with the other Riders and in the lines', () => {
    const state = city(3, 5);
    const base = transportStats(state);
    const merged = cityTransportStats(state);
    expect(merged.shiftedRiders).toBeCloseTo(congestionStats(state).shift.total);
    expect(merged.riders).toBeCloseTo(base.riders + merged.shiftedRiders);
    expect(merged.lines.reduce((sum, line) => sum + line.riders, 0)).toBeCloseTo(base.lines.reduce((sum, line) => sum + line.riders, 0) + merged.shiftedRiders);
    for (const line of merged.lines) expect(line.riders).toBeLessThanOrEqual(line.capacity + 1e-9);
  });

  it('never takes a Home beyond the maximum Rider share', () => {
    const state = city(3, 5);
    const stats = congestionStats(state);
    const base = transportStats(state);
    for (const [id, moved] of stats.shift.byHome) expect((base.homeRiders.get(id) ?? 0) + moved).toBeLessThanOrEqual(homeCitizens * SHIFT.maxRiderShare + 1e-9);
  });

  it('does nothing when the roads are not saturated', () => {
    expect(congestionStats(city(1, 5)).shift.total).toBe(0);
  });

  it('is bounded by the spare capacity of the lines', () => {
    const state = city(3, 1);
    const stats = congestionStats(state);
    const [line] = cityTransportStats(state).lines;
    expect(line!.riders).toBeLessThanOrEqual(line!.capacity + 1e-9);
    expect(stats.shift.total).toBeLessThanOrEqual(Math.max(0, line!.capacity - transportStats(state).lines[0]!.riders) + 1e-9);
  });

  it('does nothing without any line', () => {
    expect(congestionStats(city(3, 0)).shift.total).toBe(0);
  });

  it('lowers the congestion ratio the shift acts on', () => {
    const shifted = city(3, 5);
    const stats = congestionStats(shifted);
    const peak = Math.max(...[...stats.sections.values()].map((section) => section.ratio));
    const beforeShift = (3 * homeCitizens - transportStats(shifted).riders) / 100;
    expect(peak).toBeLessThan(beforeShift);
  });
});
