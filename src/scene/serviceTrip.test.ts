import { describe, expect, it } from 'vitest';
import { createBuilding, newGame, type Building, type GameState } from '../core';
import { buildRoadGraph } from './roadGraph';
import { SERVICE_TRIP_INTERVAL_SECONDS, planServiceTrip, tripDelaySeconds } from './serviceTrip';

const road = (x: number, y: number) => ({ x, y, kind: 'road' as const });
const city = (buildings: Building[], roads: GameState['roads']): GameState => ({ ...newGame({ seed: 'service-trips', now: 0 }), buildings, roads, nextId: 100 });
const hospital = createBuilding(1, 'hospital', 50, 51, 0);
const home = (id: number, x: number) => ({ ...createBuilding(id, 'home', x, 51, 0), tier: 1 });
const line = Array.from({ length: 12 }, (_, index) => road(48 + index, 50));

describe('Service vehicle trips', () => {
  it('drives from the facility to a covered Home and back by road', () => {
    const state = city([hospital, home(2, 56)], line);
    const trip = planServiceTrip(state, buildRoadGraph(state), hospital, 0);
    expect(trip).not.toBeNull();
    expect(trip![0]).toEqual(trip!.at(-1));
    expect(trip!.some((tile) => tile.x === 56)).toBe(true);
    expect(trip!.every((tile) => tile.y === 50)).toBe(true);
  });

  it('is deterministic for a Seed and trip', () => {
    const state = city([hospital, home(2, 54), home(3, 56), home(4, 58)], line);
    const graph = buildRoadGraph(state);
    expect(planServiceTrip(state, graph, hospital, 3)).toEqual(planServiceTrip(state, graph, hospital, 3));
    const destinations = new Set(Array.from({ length: 20 }, (_, index) => planServiceTrip(state, graph, hospital, index)!.reduce((far, tile) => Math.max(far, tile.x), 0)));
    expect(destinations.size).toBeGreaterThan(1);
  });

  it('sends nothing without a road between the facility and the Home', () => {
    const state = city([hospital, home(2, 56)], [road(48, 50), road(49, 50), road(50, 50), road(51, 50), road(52, 50), road(58, 50), road(59, 50)]);
    expect(planServiceTrip(state, buildRoadGraph(state), hospital, 0)).toBeNull();
  });

  it('sends nothing when no Home is covered', () => {
    const state = city([hospital], line);
    expect(planServiceTrip(state, buildRoadGraph(state), hospital, 0)).toBeNull();
  });

  it('waits between 30 and 60 seconds before each trip', () => {
    for (let index = 0; index < 50; index++) {
      const delay = tripDelaySeconds('seed', 1, index);
      expect(delay).toBeGreaterThanOrEqual(SERVICE_TRIP_INTERVAL_SECONDS.min);
      expect(delay).toBeLessThanOrEqual(SERVICE_TRIP_INTERVAL_SECONDS.max);
    }
  });
});
