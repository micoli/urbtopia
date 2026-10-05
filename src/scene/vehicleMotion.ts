import type { Coord } from '../core';
import { neighboursOf, type RoadGraph } from './roadGraph';
import { chooseNextTile } from './roadWalk';

export interface Vehicle {
  model: number;
  speed: number;
  from: Coord;
  to: Coord;
  heading: Coord;
  progress: number;
}

export interface LanePosition {
  lane?: number;
  lanes?: number;
}

export interface Pose {
  x: number;
  z: number;
  yaw: number;
}

const ROAD_HALF_WIDTH = 0.4;
const TURN_BLEND_PROGRESS = 0.5;
const MIN_HEADING_LENGTH = 0.2;

export function sameTile(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

export function directionOf(from: Coord, to: Coord): Coord {
  return { x: to.x - from.x, y: to.y - from.y };
}

export function startVehicle(graph: RoadGraph, tile: Coord, model: number, speed: number, random: () => number): Vehicle | null {
  const to = chooseNextTile(graph, tile, null, random());
  if (sameTile(to, tile)) return null;
  return { model, speed, from: tile, to, heading: directionOf(tile, to), progress: random() };
}

export function isOnRoad(graph: RoadGraph, vehicle: Vehicle): boolean {
  return neighboursOf(graph, vehicle.from).some((tile) => sameTile(tile, vehicle.to));
}

export function advanceVehicle(graph: RoadGraph, vehicle: Vehicle, deltaSeconds: number, random: () => number): boolean {
  vehicle.progress += vehicle.speed * deltaSeconds;
  while (vehicle.progress >= 1) {
    const previous = vehicle.from;
    vehicle.heading = directionOf(vehicle.from, vehicle.to);
    vehicle.from = vehicle.to;
    vehicle.to = chooseNextTile(graph, vehicle.from, previous, random());
    if (sameTile(vehicle.to, vehicle.from)) return false;
    vehicle.progress -= 1;
  }
  return true;
}

export function laneOffset(lane = 0, lanes = 1): number {
  return (ROAD_HALF_WIDTH / lanes) * (lane + 0.5);
}

export function poseOf(vehicle: Vehicle & LanePosition): Pose {
  const offset = laneOffset(vehicle.lane, vehicle.lanes);
  const direction = directionOf(vehicle.from, vehicle.to);
  const blend = Math.min(1, vehicle.progress / TURN_BLEND_PROGRESS);
  const blended = {
    x: vehicle.heading.x + (direction.x - vehicle.heading.x) * blend,
    y: vehicle.heading.y + (direction.y - vehicle.heading.y) * blend,
  };
  const length = Math.hypot(blended.x, blended.y);
  const heading = length < MIN_HEADING_LENGTH ? direction : { x: blended.x / length, y: blended.y / length };
  return {
    x: vehicle.from.x + 0.5 + direction.x * vehicle.progress - heading.y * offset,
    z: vehicle.from.y + 0.5 + direction.y * vehicle.progress + heading.x * offset,
    yaw: Math.atan2(heading.x, heading.y),
  };
}
