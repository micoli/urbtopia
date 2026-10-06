import type { Coord } from '../core';
import { allowedTravel, pickLane, type LanesAt, type TrafficVehicle } from './vehicleTraffic';

export interface ServiceTrip {
  path: readonly Coord[];
  segment: number;
  vehicle: TrafficVehicle;
}

export interface TrafficContext {
  others: readonly TrafficVehicle[];
  stopTiles: ReadonlySet<string>;
  lanesAt: LanesAt;
}

export function startServiceTrip(path: readonly Coord[], id: number, speed: number): ServiceTrip {
  const [from, to] = path as [Coord, Coord];
  return { path, segment: 0, vehicle: { id, model: 0, speed, from, to, heading: { x: to.x - from.x, y: to.y - from.y }, progress: 0, lane: 0, lanes: 1 } };
}

export function driveServiceTrip(trip: ServiceTrip, deltaSeconds: number, traffic: TrafficContext | null): boolean {
  const { vehicle, path } = trip;
  const wanted = vehicle.speed * deltaSeconds;
  vehicle.progress += traffic ? allowedTravel(vehicle, wanted, traffic.others, traffic.stopTiles, deltaSeconds) : wanted;
  while (vehicle.progress >= 1) {
    vehicle.progress -= 1;
    trip.segment++;
    const next = path[trip.segment + 1];
    if (!next) return true;
    vehicle.heading = { x: path[trip.segment]!.x - vehicle.from.x, y: path[trip.segment]!.y - vehicle.from.y };
    vehicle.from = path[trip.segment]!;
    vehicle.to = next;
    if (!traffic) continue;
    vehicle.lanes = traffic.lanesAt(vehicle.from);
    vehicle.lane = pickLane(vehicle.from, vehicle.to, vehicle.lanes, vehicle.lane, traffic.others.filter((other) => other !== vehicle));
  }
  return false;
}
