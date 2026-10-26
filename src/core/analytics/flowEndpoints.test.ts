import { afterEach, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { citizensOf, congestionStats, createBuilding, newGame, type Building, type GameState } from '../index';
import { FLOW_ENDPOINTS, flowEndpointsOf } from './flowEndpoints';

const base = newGame({ seed: 'flow-endpoints', now: 0 });
const withBuildings = (specs: { type: Parameters<typeof createBuilding>[1]; x: number; y: number; tier?: number }[], state: GameState = base): GameState => {
  let nextId = state.nextId;
  const added: Building[] = specs.map(spec => ({ ...createBuilding(nextId++, spec.type, spec.x, spec.y, 0), tier: spec.tier ?? 1 }));
  return { ...state, roads: [...state.roads], nextId, buildings: [...state.buildings, ...added] };
};

afterEach(() => {
  WALKING.enabled = true;
});

describe('flow endpoints', () => {
  it('has none outside the Movement layers', () => {
    expect(flowEndpointsOf(base, 'data.pollution')).toBeNull();
  });

  it('lists the Homes the Commuters leave from and the workplaces they drive to', () => {
    WALKING.enabled = false;
    const state = withBuildings([{ type: 'home', x: 56, y: 59 }]);
    const home = state.buildings.at(-1)!;
    const { origins, destinations } = flowEndpointsOf(state, 'movement.cars')!;
    expect(origins).toEqual([expect.objectContaining({ id: home.id, volume: citizensOf(1) })]);
    expect(destinations.length).toBeGreaterThan(0);
    expect(destinations.reduce((sum, endpoint) => sum + endpoint.volume, 0)).toBe(Math.round(citizensOf(1)));
  });

  it('leaves out a Home with no road to a workplace', () => {
    WALKING.enabled = false;
    const state = withBuildings([{ type: 'home', x: 56, y: 59 }, { type: 'home', x: 100, y: 100 }]);
    const far = state.buildings.at(-1)!;
    expect(flowEndpointsOf(state, 'movement.cars')!.origins.map(endpoint => endpoint.id)).not.toContain(far.id);
  });

  it('ranks the busiest first and keeps only the main ones', () => {
    WALKING.enabled = false;
    const state = withBuildings(Array.from({ length: 8 }, (_, index) => ({ type: 'home' as const, x: 40 + index * 3, y: 59, tier: 1 + (index % 3) })));
    const { origins } = flowEndpointsOf(state, 'movement.cars')!;
    expect(origins.length).toBeLessThanOrEqual(FLOW_ENDPOINTS.count);
    expect(origins.map(endpoint => endpoint.volume)).toEqual([...origins.map(endpoint => endpoint.volume)].sort((a, b) => b - a));
  });

  it('counts the walking trips to a shop for Pedestrians', () => {
    const state = withBuildings([{ type: 'shop', x: 57, y: 57 }, { type: 'home', x: 56, y: 59 }]);
    const shop = state.buildings.find(building => building.type === 'shop')!;
    const { origins, destinations } = flowEndpointsOf(state, 'movement.pedestrians')!;
    expect(origins.length).toBeGreaterThan(0);
    expect(destinations.map(endpoint => endpoint.id)).toContain(shop.id);
    expect(congestionStats(state).walkArrivals.get(shop.id)).toBeGreaterThan(0);
  });

  it('adds both modes in All', () => {
    const state = withBuildings([{ type: 'shop', x: 57, y: 57 }, { type: 'home', x: 56, y: 59 }]);
    const all = flowEndpointsOf(state, 'movement.all')!;
    const cars = flowEndpointsOf(state, 'movement.cars')!;
    const walking = flowEndpointsOf(state, 'movement.pedestrians')!;
    const volume = (endpoints: { volume: number }[]) => endpoints.reduce((sum, endpoint) => sum + endpoint.volume, 0);
    expect(volume(all.origins)).toBeGreaterThanOrEqual(Math.max(volume(cars.origins), volume(walking.origins)));
  });

  it('is independent of the order of the buildings', () => {
    const state = withBuildings([{ type: 'home', x: 56, y: 59 }, { type: 'home', x: 40, y: 59, tier: 2 }]);
    const reversed = { ...state, buildings: [...state.buildings].reverse() };
    expect(flowEndpointsOf(reversed, 'movement.cars')).toEqual(flowEndpointsOf(state, 'movement.cars'));
  });
});
