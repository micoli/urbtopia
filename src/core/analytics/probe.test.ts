import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { congestionStats, createBuilding, newGame, type Building, type GameState } from '../index';
import { probeOf } from './probe';

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

const base = newGame({ seed: 'probe', now: 0 });
const home = (id: number, x: number, y: number, tier = 1): Building => ({ ...createBuilding(id, 'home', x, y, 0), tier });
const withBuildings = (...buildings: Building[]): GameState => ({ ...base, buildings: [...base.buildings, ...buildings], nextId: 5000, adaptationUntil: 0 });

describe('probe', () => {
  it('reads nothing on an empty tile', () => {
    expect(probeOf(withBuildings(), 'data.pollution', 'education', { x: 100, y: 100 })).toBeNull();
  });

  it('names the Coal plant behind a Pollution reading', () => {
    const state = withBuildings(createBuilding(1, 'coalPlant', 60, 60, 0), home(2, 62, 60));
    const probe = probeOf(state, 'data.pollution', 'education', { x: 62, y: 60 });
    expect(probe?.lines[0]?.value).toBeGreaterThan(0);
    expect(probe?.causes.map(cause => cause.key)).toContain('analytics.cause.coal');
  });

  it('names the Mound behind an Odor reading', () => {
    const roads = Array.from({ length: 61 }, (_, index) => ({ x: 30 + index, y: 49, kind: 'road' as const }));
    const state = { ...withBuildings(home(10, 64, 48, 2), createBuilding(1, 'mound', 66, 50, 0)), roads, roundabouts: [], pedestrianWays: [] };
    const probe = probeOf(state, 'data.odor', 'education', { x: 64, y: 48 });
    expect(probe?.lines[0]?.value).toBeGreaterThan(0);
    expect(probe?.causes.map(cause => cause.key)).toEqual(['analytics.cause.mound']);
  });

  it('explains a saturated Road by its load and capacity', () => {
    const crowded = { ...base, buildings: base.buildings.map(building => ({ ...building, tier: 8 })) };
    const state = { ...crowded, buildings: [...crowded.buildings, { ...home(1, 56, 59, 7) }], nextId: 5000 };
    const worst = congestionStats(state).worstBottleneck;
    expect(worst).not.toBeNull();
    const probe = probeOf(state, 'data.congestion', 'education', worst!.tile);
    expect(probe!.causes.map(cause => cause.key)).toContain('analytics.cause.overCapacity');
  });

  it('reads the Well-being of the Home on the tile with its main parts', () => {
    const state = withBuildings(home(1, 56, 59, 2));
    const probe = probeOf(state, 'data.wellbeing', 'education', { x: 56, y: 59 });
    expect(probe?.lines[0]?.key).toBe('analytics.layer.data.wellbeing');
    expect(probe!.causes.length).toBeLessThanOrEqual(3);
  });

  it('says a Home has no facility of the category', () => {
    const state = withBuildings(home(1, 56, 59));
    const probe = probeOf(state, 'data.coverage', 'health', { x: 56, y: 59 });
    expect(probe?.lines[0]?.key).toBe('analytics.legend.uncovered');
    expect(probe?.causes.map(cause => cause.key)).toEqual(['analytics.cause.noFacility']);
  });

  it('reads coverage on a bare tile, and says why it is not covered', () => {
    const state = withBuildings(createBuilding(1, 'school', 60, 60, 0));
    expect(probeOf(state, 'data.coverage', 'education', { x: 62, y: 60 })?.lines[0]?.key).toBe('analytics.legend.covered');
    const far = probeOf(state, 'data.coverage', 'health', { x: 62, y: 60 });
    expect(far?.lines[0]?.key).toBe('analytics.legend.uncovered');
    expect(far?.causes.map(cause => cause.key)).toEqual(['analytics.cause.noFacility']);
  });

  it('ranks the sources of Land value', () => {
    const state = withBuildings(createBuilding(1, 'park', 60, 60, 0), createBuilding(2, 'school', 62, 60, 0));
    const probe = probeOf(state, 'data.landValue', 'education', { x: 61, y: 61 });
    expect(probe?.causes[0]?.key.startsWith('analytics.cause.land.')).toBe(true);
  });

  it('is a pure read: the state is untouched', () => {
    const state = withBuildings(home(1, 56, 59));
    const before = JSON.stringify(state);
    probeOf(state, 'data.landValue', 'education', { x: 56, y: 59 });
    expect(JSON.stringify(state)).toBe(before);
  });
});
