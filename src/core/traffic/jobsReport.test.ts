import { describe, expect, it } from 'vitest';
import { congestionStats, createBuilding, newGame, type Building, type GameState } from '../index';
import { jobKindOf, jobsByKind, jobsByMode, venueStaffRows } from './jobsReport';

const arcade: Building = { ...createBuilding(41, 'arcade', 60, 59, 0), tier: 3, venue: { fixtures: [], nextFixtureId: 1, takings: 0, staff: { employee: 2 } } };
const home: Building = { ...createBuilding(40, 'home', 55, 59, 0), tier: 1 };
const state = (buildings: Building[]): GameState => ({ ...newGame({ seed: 'jobs-report', now: 0 }), tutorial: null, adaptationUntil: 0, buildings });

describe('jobs report', () => {
  it('names the kind of each workplace', () => {
    expect(jobKindOf(arcade)).toBe('venues');
    expect(jobKindOf(createBuilding(1, 'office', 0, 0, 0))).toBe('offices');
    expect(jobKindOf(createBuilding(2, 'factory', 0, 0, 0))).toBe('industry');
    expect(jobKindOf(createBuilding(3, 'casino', 0, 0, 0))).toBe('casino');
    expect(jobKindOf(createBuilding(4, 'home', 0, 0, 0))).toBeNull();
  });

  it('adds up the Jobs offered and filled by kind, leaving out the kinds with no Job', () => {
    const city = state([arcade, home]);
    const rows = jobsByKind(city, congestionStats(city));
    expect(rows.map(row => row.kind)).toEqual(['venues']);
    expect(rows[0]!.offered).toBe(2);
    expect(rows[0]!.filled).toBeGreaterThan(0);
  });

  it('adds up the modes of the Citizens at work', () => {
    const city = state([arcade, home]);
    const modes = jobsByMode(congestionStats(city));
    expect(modes.walking + modes.cycling + modes.car + modes.transit).toBeCloseTo(jobsByKind(city, congestionStats(city))[0]!.filled);
  });

  it('lists the Venues with Staff, the least filled first', () => {
    const empty: Building = { ...arcade, id: 42, x: 80, y: 80 };
    const city = state([arcade, empty, home]);
    const rows = venueStaffRows(city, congestionStats(city));
    expect(rows.map(row => row.building.id)).toEqual([42, 41]);
    expect(rows[0]).toMatchObject({ hired: 2, filled: 0 });
    expect(rows[0]!.posts).toBeGreaterThanOrEqual(2);
  });
});
