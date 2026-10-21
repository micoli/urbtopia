import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { createBuilding, newGame, transitReachCodexFigures, TRANSIT_REACH, type GameState, type TransitTile } from '../index';

const walkingEnabled = WALKING.enabled;
beforeAll(() => { WALKING.enabled = false; });
afterAll(() => { WALKING.enabled = walkingEnabled; });

const strip: TransitTile[] = Array.from({ length: 45 }, (_, i) => ({ x: i, y: 0, exits: i === 0 ? ['E'] : i === 44 ? ['W'] : ['W', 'E'] }));

const city = (withLine: boolean): GameState => ({ ...newGame({ seed: 'transit-reach-figures', now: 0 }), adaptationUntil: 0, roundabouts: [], brtRoads: strip,
  buildings: [createBuilding(1, 'school', 3, 3, 0), { ...createBuilding(2, 'home', 40, 3, 0), tier: 2 }, { ...createBuilding(8, 'home', 8, 8, 0), tier: 2 }, createBuilding(3, 'brtStation', 3, 1, 0), createBuilding(4, 'brtStation', 40, 1, 0), createBuilding(5, 'mound', 20, 20, 0)],
  ...(withLine ? { transitLines: [{ id: 10, mode: 'brt' as const, stops: [3, 4], peakHeadway: 5, offPeakHeadway: 10 }], transitFleet: [{ id: 11, kind: 'brtElectric' as const, purchasePrice: 900, lineId: 10 }] } : {}) });

describe('transitReachCodexFigures', () => {
  it('counts Homes covered directly and through Transit reach per Service category', () => {
    const figures = transitReachCodexFigures(city(true));
    expect(figures.maxMinutes).toBe(TRANSIT_REACH.maxMinutes);
    expect(figures.lines).toBe(1);
    expect(figures.stops).toBe(2);
    expect(figures.categories).toEqual([{ category: 'education', facilities: 1, homes: 2, direct: 1, viaTransit: 1 }]);
    expect(figures.facilities).toEqual([{ id: 1, type: 'school', homes: 1 }]);
  });

  it('shows no Home reached through transit without a line', () => {
    const figures = transitReachCodexFigures(city(false));
    expect(figures.lines).toBe(0);
    expect(figures.categories[0]).toMatchObject({ direct: 1, viaTransit: 0 });
    expect(figures.facilities).toEqual([{ id: 1, type: 'school', homes: 0 }]);
  });

  it('leaves Waste out', () => {
    const figures = transitReachCodexFigures(city(true));
    expect(figures.excluded).toEqual(['waste']);
    expect(figures.categories.map(({ category }) => category)).not.toContain('waste');
    expect(figures.facilities.map(({ type }) => type)).not.toContain('mound');
  });
});
