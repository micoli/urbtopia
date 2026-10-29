import { describe, expect, it } from 'vitest';
import { congestionStats, crossingFlows, createBuilding, footbridgeFlows, newGame, passageBeaconsOf, probeOf, type Building } from '../index';
import { WALKING } from './walking';

const base = newGame({ seed: 'walk-flows', now: 0 });

function city() {
  let nextId = base.nextId;
  const added: Building[] = [
    { ...createBuilding(nextId++, 'shop', 57, 57, 0), tier: 1 },
    { ...createBuilding(nextId++, 'home', 56, 59, 0), tier: 3 },
    { ...createBuilding(nextId++, 'home', 59, 59, 0), tier: 3 },
  ];
  const roads = base.roads.map((road) => (road.x === 57 && road.y === 58 ? { ...road, kind: 'crossing' as const } : road));
  return { ...base, roads, nextId, buildings: [...base.buildings, ...added] };
}

describe('Walk flows', () => {
  it('lists the Crossings by descending pedestrian volume', () => {
    WALKING.workThreshold = 0;
    const flows = crossingFlows(congestionStats(city()));
    WALKING.workThreshold = 10;
    expect(flows.length).toBeGreaterThan(0);
    expect(flows[0]!.tile).toEqual({ x: 57, y: 58 });
    expect(flows[0]!.pedestrians).toBeGreaterThan(0);
    expect(flows.map((flow) => flow.pedestrians)).toEqual([...flows.map((flow) => flow.pedestrians)].sort((a, b) => b - a));
  });

  it('lists no Footbridge in a city without one', () => {
    const state = city();
    expect(footbridgeFlows(state, congestionStats(state))).toEqual([]);
  });

  it('reads the Pedestrians of a Crossing in the probe and marks it on the map', () => {
    WALKING.workThreshold = 0;
    const state = city();
    const probe = probeOf(state, 'movement.pedestrians', 'health', { x: 57, y: 58 });
    const beacons = passageBeaconsOf(state, 'movement.pedestrians');
    WALKING.workThreshold = 10;
    expect(probe?.lines.find((line) => line.key === 'analytics.flow.crossing')?.value).toBeGreaterThan(0);
    expect(beacons?.walks[0]).toMatchObject({ x: 57, y: 58, width: 1, depth: 1 });
    expect(passageBeaconsOf(state, 'movement.cars')).toBeNull();
  });
});
