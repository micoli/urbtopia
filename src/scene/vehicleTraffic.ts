import { tileKey, type Coord } from '../core';
import { neighboursOf, type RoadGraph } from './roadGraph';
import { chooseNextTile } from './roadWalk';
import { directionOf, sameTile, type Vehicle } from './vehicleMotion';

export const MIN_GAP = 0.4;
export const NODE_CLEARANCE = 0.45;
const STOP_BEFORE_NODE = 0.02;
const TILE_EDGE_PROGRESS = 0.5;
const STOP_BEFORE_CROSSING = 0.3;
export const NODE_PATIENCE_SECONDS = 1.5;

export interface BusRun {
  tiles: readonly Coord[];
  index: number;
  step: 1 | -1;
}

export interface TrafficVehicle extends Vehicle {
  id: number;
  lane: number;
  lanes: number;
  blockedSeconds?: number;
  run?: BusRun;
}

export type LanesAt = (tile: Coord) => number;

function sameEdge(a: Vehicle, b: Vehicle): boolean {
  return sameTile(a.from, b.from) && sameTile(a.to, b.to);
}

function hasPriority(other: TrafficVehicle, vehicle: TrafficVehicle): boolean {
  if (other.progress !== vehicle.progress) return other.progress > vehicle.progress;
  return other.id < vehicle.id;
}

export function distanceToLeader(vehicle: TrafficVehicle, others: readonly TrafficVehicle[]): number {
  let nearest = Infinity;
  for (const other of others) {
    if (other === vehicle || other.lane !== vehicle.lane || !sameEdge(other, vehicle) || other.progress <= vehicle.progress) continue;
    nearest = Math.min(nearest, other.progress - vehicle.progress - MIN_GAP);
  }
  return nearest;
}

export function nodeIsFree(vehicle: TrafficVehicle, others: readonly TrafficVehicle[]): boolean {
  for (const other of others) {
    if (other === vehicle) continue;
    if (sameTile(other.from, vehicle.to) && other.progress < NODE_CLEARANCE) return false;
    const arrivesAtSameNode = sameTile(other.to, vehicle.to) && !sameTile(other.from, vehicle.from);
    if (arrivesAtSameNode && other.progress > 1 - NODE_CLEARANCE && hasPriority(other, vehicle)) return false;
  }
  return true;
}

export function isSpotFree(candidate: TrafficVehicle, others: readonly TrafficVehicle[]): boolean {
  for (const other of others) {
    if (sameEdge(other, candidate) && other.lane === candidate.lane && Math.abs(other.progress - candidate.progress) < MIN_GAP) return false;
    if (sameTile(other.from, candidate.from) && other.progress < NODE_CLEARANCE && candidate.progress < NODE_CLEARANCE) return false;
  }
  return true;
}

export function pickLane(from: Coord, to: Coord, lanes: number, preferred: number, others: readonly TrafficVehicle[]): number {
  const crowding = (lane: number) => others.filter((other) => sameTile(other.from, from) && sameTile(other.to, to) && other.lane === lane && other.progress < MIN_GAP * 2).length;
  let best = Math.min(preferred, lanes - 1);
  for (let lane = 0; lane < lanes; lane++) if (crowding(lane) < crowding(best)) best = lane;
  return best;
}

export function startTrafficVehicle(graph: RoadGraph, tile: Coord, id: number, model: number, speed: number, lanesAt: LanesAt, random: () => number): TrafficVehicle | null {
  const to = chooseNextTile(graph, tile, null, random());
  if (sameTile(to, tile)) return null;
  const lanes = lanesAt(tile);
  return { id, model, speed, from: tile, to, heading: directionOf(tile, to), progress: random(), lane: Math.floor(random() * lanes), lanes };
}

const NO_STOPS: ReadonlySet<string> = new Set();

export function startBusVehicle(tiles: readonly Coord[], id: number, model: number, speed: number, lanesAt: LanesAt, start: number): TrafficVehicle | null {
  if (tiles.length < 2) return null;
  const index = start % (tiles.length - 1);
  const from = tiles[index]!;
  const to = tiles[index + 1]!;
  return { id, model, speed, from, to, heading: directionOf(from, to), progress: 0, lane: 0, lanes: lanesAt(from), run: { tiles, index: index + 1, step: 1 } };
}

export function nextRunTile(run: BusRun): Coord {
  if (run.tiles[run.index + run.step] === undefined) run.step = run.step === 1 ? -1 : 1;
  run.index += run.step;
  return run.tiles[run.index]!;
}

export function allowedTravel(vehicle: TrafficVehicle, wanted: number, others: readonly TrafficVehicle[], stopTiles: ReadonlySet<string> = NO_STOPS, deltaSeconds = 0): number {
  let travel = Math.min(wanted, Math.max(0, distanceToLeader(vehicle, others)));
  if (vehicle.progress < TILE_EDGE_PROGRESS && stopTiles.has(tileKey(vehicle.to))) travel = Math.min(travel, Math.max(0, STOP_BEFORE_CROSSING - vehicle.progress));
  if (vehicle.progress + travel < 1) {
    vehicle.blockedSeconds = 0;
    return travel;
  }
  if (nodeIsFree(vehicle, others) || (vehicle.blockedSeconds ?? 0) >= NODE_PATIENCE_SECONDS) {
    vehicle.blockedSeconds = 0;
    return travel;
  }
  vehicle.blockedSeconds = (vehicle.blockedSeconds ?? 0) + deltaSeconds;
  return Math.min(travel, Math.max(0, 1 - STOP_BEFORE_NODE - vehicle.progress));
}

export function advanceTrafficVehicle(graph: RoadGraph, vehicle: TrafficVehicle, deltaSeconds: number, random: () => number, others: readonly TrafficVehicle[], lanesAt: LanesAt, stopTiles: ReadonlySet<string> = NO_STOPS): boolean {
  const travel = allowedTravel(vehicle, vehicle.speed * deltaSeconds, others, stopTiles, deltaSeconds);
  vehicle.progress += travel;
  if (vehicle.progress < 1) return true;
  const previous = vehicle.from;
  vehicle.heading = directionOf(vehicle.from, vehicle.to);
  vehicle.from = vehicle.to;
  vehicle.to = vehicle.run ? nextRunTile(vehicle.run) : chooseNextTile(graph, vehicle.from, previous, random());
  if (sameTile(vehicle.to, vehicle.from)) return false;
  vehicle.progress -= 1;
  vehicle.lanes = lanesAt(vehicle.from);
  vehicle.lane = pickLane(vehicle.from, vehicle.to, vehicle.lanes, vehicle.lane, others.filter((other) => other !== vehicle));
  vehicle.progress = Math.max(0, Math.min(vehicle.progress, vehicle.progress + distanceToLeader(vehicle, others)));
  return true;
}

export function isOnTrafficRoad(graph: RoadGraph, vehicle: Vehicle): boolean {
  return neighboursOf(graph, vehicle.from).some((tile) => sameTile(tile, vehicle.to));
}

export function laneTileCount(tiers: ReadonlyMap<string, number>, roadTiles: readonly Coord[]): number {
  return roadTiles.reduce((sum, tile) => sum + (tiers.get(tileKey(tile)) ?? 1), 0);
}
