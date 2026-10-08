import { describe, expect, it } from 'vitest';
import type { Coord } from '../core';
import { driveServiceTrip, startServiceTrip, type TrafficContext } from './serviceDrive';
import { TRAFFIC_OPTIONS } from './trafficOptions';
import { edgeKey, type TrafficVehicle } from './vehicleTraffic';

const path: Coord[] = [0, 1, 2, 3].map((x) => ({ x, y: 5 }));
const single = () => 1;

function car(from: Coord, to: Coord, progress: number): TrafficVehicle {
  return { id: 1, model: 0, speed: 0, from, to, heading: { x: to.x - from.x, y: to.y - from.y }, progress, lane: 0, lanes: 1 };
}

function context(others: TrafficVehicle[] = [], stopTiles: string[] = []): TrafficContext {
  return { others, stopTiles: new Set(stopTiles), lanesAt: single };
}

describe('service vehicles and traffic', () => {
  it('are not subject to traffic by default', () => {
    expect(TRAFFIC_OPTIONS.SERVICE_VEHICLES_FOLLOW_TRAFFIC).toBe(false);
  });

  it('drive straight through a slower car and pedestrians when they keep their priority', () => {
    const trip = startServiceTrip(path, -3, 2);
    let finished = false;
    for (let step = 0; step < 4 && !finished; step++) finished = driveServiceTrip(trip, 1, null);
    expect(finished).toBe(true);
    expect(trip.vehicle.lane).toBe(0);
  });

  it('queue behind a slower car when subject to traffic', () => {
    const trip = startServiceTrip(path, -3, 2);
    const blocker = car(path[0]!, path[1]!, 0.7);
    const traffic = context([trip.vehicle, blocker]);
    for (let step = 0; step < 6; step++) expect(driveServiceTrip(trip, 1, traffic)).toBe(false);
    expect(trip.vehicle.from).toEqual(path[0]);
    expect(trip.vehicle.progress).toBeLessThan(0.7);
  });

  it('wait before a Crossing in use and go on afterwards', () => {
    const trip = startServiceTrip(path, -3, 2);
    for (let step = 0; step < 4; step++) driveServiceTrip(trip, 1, context([trip.vehicle], ['1,5']));
    expect(trip.vehicle.from).toEqual(path[0]);
    expect(trip.vehicle.progress).toBeLessThan(0.5);
    driveServiceTrip(trip, 0.5, context([trip.vehicle]));
    expect(trip.vehicle.from).toEqual(path[1]);
  });

  it('finish their trip once the way is free', () => {
    const trip = startServiceTrip(path, -3, 2);
    let finished = false;
    for (let step = 0; step < 6 && !finished; step++) finished = driveServiceTrip(trip, 1, context([trip.vehicle]));
    expect(finished).toBe(true);
  });
});

describe('service vehicles and Bridge gates', () => {
  const gate = new Set([edgeKey(path[1]!, path[2]!)]);

  it('stop in front of a Bridge that is open, even though they ignore traffic', () => {
    const trip = startServiceTrip(path, -3, 2);
    for (let step = 0; step < 80; step++) expect(driveServiceTrip(trip, 0.1, null, gate)).toBe(false);
    expect(trip.vehicle.from).toEqual(path[1]);
    expect(trip.vehicle.to).toEqual(path[2]);
    expect(trip.vehicle.progress).toBeCloseTo(0.3);
  });

  it('go on once the Bridge is closed again', () => {
    const trip = startServiceTrip(path, -3, 2);
    for (let step = 0; step < 40; step++) driveServiceTrip(trip, 0.1, null, gate);
    let finished = false;
    for (let step = 0; step < 80 && !finished; step++) finished = driveServiceTrip(trip, 0.1, null);
    expect(finished).toBe(true);
  });

  it('still honour the gates when subject to traffic', () => {
    const trip = startServiceTrip(path, -3, 2);
    const traffic = context([trip.vehicle]);
    for (let step = 0; step < 80; step++) driveServiceTrip(trip, 0.1, traffic, gate);
    expect(trip.vehicle.from).toEqual(path[1]);
    expect(trip.vehicle.progress).toBeCloseTo(0.3);
  });
});
