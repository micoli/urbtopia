import { describe, expect, it } from 'vitest';
import { newGame, type Coord, type GameState } from '../core';
import { buildRoadGraph } from './roadGraph';
import { MIN_GAP, advanceTrafficVehicle, distanceToLeader, isSpotFree, nodeIsFree, pickLane, startBusVehicle, type TrafficVehicle } from './vehicleTraffic';
import { poseOf } from './vehicleMotion';

function graphOf(roads: [number, number][]) {
  const state: GameState = { ...newGame({ now: 0, seed: 'test' }), roads: roads.map(([x, y]) => ({ x, y, kind: 'road' as const })), roundabouts: [] };
  return buildRoadGraph(state);
}

const vehicle = (id: number, from: Coord, to: Coord, progress: number, lane = 0, speed = 2): TrafficVehicle => ({ id, model: 0, speed, from, to, heading: { x: to.x - from.x, y: to.y - from.y }, progress, lane, lanes: 2 });
const one = () => 1;
const lanesAt = () => 2;
const tee = graphOf([[0, 5], [1, 5], [2, 5], [1, 4]]);
const row = graphOf([[0, 5], [1, 5], [2, 5], [3, 5], [4, 5]]);

describe('car following', () => {
  it('measures the free distance to the leader of the same Lane', () => {
    const follower = vehicle(1, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.1);
    const leader = vehicle(2, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.8);
    expect(distanceToLeader(follower, [follower, leader])).toBeCloseTo(0.8 - 0.1 - MIN_GAP);
  });

  it('ignores vehicles of another Lane, another edge or behind', () => {
    const follower = vehicle(1, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.5);
    const otherLane = vehicle(2, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.8, 1);
    const oppositeWay = vehicle(3, { x: 2, y: 5 }, { x: 1, y: 5 }, 0.8);
    const behind = vehicle(4, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.2);
    expect(distanceToLeader(follower, [follower, otherLane, oppositeWay, behind])).toBe(Infinity);
  });

  it('never closes in on a slower leader below the minimum gap', () => {
    const leader = vehicle(2, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.9, 0, 1);
    const follower = vehicle(1, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.1, 0, 5);
    for (let step = 0; step < 50; step++) {
      advanceTrafficVehicle(row, leader, 0.1, one, [leader, follower], () => 1);
      advanceTrafficVehicle(row, follower, 0.1, one, [leader, follower], () => 1);
      if (leader.from.x === follower.from.x) expect(leader.progress - follower.progress).toBeGreaterThanOrEqual(MIN_GAP - 1e-9);
    }
  });
});

describe('intersections', () => {
  it('lets only one vehicle through at a time', () => {
    const west = vehicle(1, { x: 0, y: 5 }, { x: 1, y: 5 }, 0.95);
    const north = vehicle(2, { x: 1, y: 4 }, { x: 1, y: 5 }, 0.9);
    expect(nodeIsFree(west, [west, north])).toBe(true);
    expect(nodeIsFree(north, [west, north])).toBe(false);
  });

  it('blocks a vehicle while another one just left the node', () => {
    const waiting = vehicle(1, { x: 0, y: 5 }, { x: 1, y: 5 }, 0.97);
    const leaving = vehicle(2, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.1);
    expect(nodeIsFree(waiting, [waiting, leaving])).toBe(false);
    leaving.progress = 0.6;
    expect(nodeIsFree(waiting, [waiting, leaving])).toBe(true);
  });

  it('holds a blocked vehicle before the node', () => {
    const waiting = vehicle(1, { x: 0, y: 5 }, { x: 1, y: 5 }, 0.9);
    const leaving = vehicle(2, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.1, 0, 0);
    advanceTrafficVehicle(tee, waiting, 1, one, [waiting, leaving], lanesAt);
    expect(waiting.from).toEqual({ x: 0, y: 5 });
    expect(waiting.progress).toBeLessThan(1);
  });
});

describe('lanes and spawning', () => {
  it('picks the emptiest Lane when entering an edge', () => {
    const busy = vehicle(2, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.1, 0);
    expect(pickLane({ x: 1, y: 5 }, { x: 2, y: 5 }, 2, 0, [busy])).toBe(1);
  });

  it('refuses to spawn on an occupied Lane position', () => {
    const existing = vehicle(1, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.5);
    expect(isSpotFree(vehicle(2, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.6), [existing])).toBe(false);
    expect(isSpotFree(vehicle(3, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.6, 1), [existing])).toBe(true);
    expect(isSpotFree(vehicle(4, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.95), [existing])).toBe(true);
  });

  it('keeps vehicles from ever overlapping on a busy loop of road', () => {
    const vehicles = [0, 1, 2, 3, 4, 5].map((index) => vehicle(index + 1, { x: index % 4, y: 5 }, { x: (index % 4) + 1, y: 5 }, (index * 0.37) % 1, index % 2, 1 + index * 0.4));
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let step = 0; step < 600; step++) {
      for (const current of [...vehicles]) advanceTrafficVehicle(row, current, 0.05, random, vehicles, lanesAt);
      for (const a of vehicles) for (const b of vehicles) {
        if (a.id >= b.id || a.lane !== b.lane || a.from.x !== b.from.x || a.to.x !== b.to.x) continue;
        expect(Math.abs(a.progress - b.progress)).toBeGreaterThan(MIN_GAP - 0.05);
      }
    }
  });
});

describe('stopping for pedestrians', () => {
  const crossing = new Set(['1,5']);

  it('holds a vehicle on the tile before the crossing, never on the crossing tile', () => {
    const car = vehicle(1, { x: 0, y: 5 }, { x: 1, y: 5 }, 0.1, 0, 4);
    for (let step = 0; step < 5; step++) advanceTrafficVehicle(row, car, 1, one, [car], lanesAt, crossing);
    expect(car.from).toEqual({ x: 0, y: 5 });
    expect(car.progress).toBeCloseTo(0.3);
    expect(car.progress).toBeLessThan(0.5);
  });

  it('lets a vehicle already past the tile edge clear the crossing', () => {
    const car = vehicle(1, { x: 0, y: 5 }, { x: 1, y: 5 }, 0.6, 0, 4);
    advanceTrafficVehicle(row, car, 1, one, [car], lanesAt, crossing);
    expect(car.from).toEqual({ x: 1, y: 5 });
  });

  it('moves on once the pedestrians are gone', () => {
    const car = vehicle(1, { x: 0, y: 5 }, { x: 1, y: 5 }, 0.3, 0, 4);
    advanceTrafficVehicle(row, car, 1, one, [car], lanesAt);
    expect(car.from).toEqual({ x: 1, y: 5 });
  });
});

describe('buses in traffic', () => {
  const tiles: Coord[] = [0, 1, 2, 3].map((x) => ({ x, y: 5 }));
  const single = () => 1;
  const bus = (start = 0) => startBusVehicle(tiles, 9, 7, 1.5, single, start)!;

  it('starts on its route, heading to the next tile', () => {
    const started = bus(1);
    expect(started.from).toEqual({ x: 1, y: 5 });
    expect(started.to).toEqual({ x: 2, y: 5 });
    expect(started.run).toBeDefined();
    expect(startBusVehicle([tiles[0]!], 9, 7, 1.5, single, 0)).toBeNull();
  });

  it('drives its route back and forth', () => {
    const driving = bus();
    const visited: number[] = [];
    for (let step = 0; step < 14; step++) {
      advanceTrafficVehicle(row, driving, 1 / 1.5, one, [driving], single);
      if (visited.at(-1) !== driving.to.x) visited.push(driving.to.x);
    }
    expect(visited.slice(0, 8)).toEqual([2, 3, 2, 1, 0, 1, 2, 3]);
  });

  it('keeps to the right-hand side in both directions', () => {
    const driving = bus();
    expect(poseOf(driving).z).toBeCloseTo(5.5 + 0.2);
    for (let step = 0; step < 4; step++) advanceTrafficVehicle(row, driving, 1 / 1.5, one, [driving], single);
    expect(driving.to.x).toBeLessThan(driving.from.x);
    driving.progress = 0;
    expect(poseOf(driving).z).toBeCloseTo(5.5 - 0.2 * 1);
  });

  it('queues behind a slower car instead of driving through it', () => {
    const driving = bus();
    const car = vehicle(1, { x: 0, y: 5 }, { x: 1, y: 5 }, 0.6, 0, 0);
    car.lanes = 1;
    driving.lanes = 1;
    for (let step = 0; step < 10; step++) advanceTrafficVehicle(row, driving, 1, one, [driving, car], single);
    expect(driving.from).toEqual({ x: 0, y: 5 });
    expect(driving.progress).toBeLessThanOrEqual(0.6 - MIN_GAP + 1e-9);
  });

  it('waits for pedestrians crossing the next tile', () => {
    const driving = bus();
    for (let step = 0; step < 6; step++) advanceTrafficVehicle(row, driving, 1, one, [driving], single, new Set(['1,5']));
    expect(driving.from).toEqual({ x: 0, y: 5 });
    expect(driving.progress).toBeLessThan(0.5);
  });
});
