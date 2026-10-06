import { describe, expect, it } from 'vitest';
import { newGame, type Coord, type GameState } from '../core';
import { buildRoadGraph } from './roadGraph';
import { MIN_GAP, advanceTrafficVehicle, distanceToLeader, isSpotFree, nodeIsFree, pickLane, type TrafficVehicle } from './vehicleTraffic';

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
    const leader = vehicle(2, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.9, 0, 0.1);
    const follower = vehicle(1, { x: 1, y: 5 }, { x: 2, y: 5 }, 0.1, 0, 5);
    for (let step = 0; step < 50; step++) {
      advanceTrafficVehicle(row, leader, 0.1, one, [leader, follower], lanesAt);
      advanceTrafficVehicle(row, follower, 0.1, one, [leader, follower], lanesAt);
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
