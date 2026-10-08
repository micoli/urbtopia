import type { Coord } from '../core';

export const DRIFT_SPEED = 0.12;
const MIN_REST = 0.5;
const MAX_REST = 3;
const BLOCKED_REST = 1;

const DIRECTIONS: readonly Coord[] = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

export interface DriftBoat {
  id: number;
  anchor: Coord;
  from: Coord;
  to: Coord | null;
  progress: number;
  rest: number;
  heading: number;
}

export interface DriftContext {
  water: ReadonlySet<string>;
  reserved: Map<string, number>;
  random: () => number;
}

export const keyOf = (tile: Coord) => `${tile.x},${tile.y}`;

export function startDrift(id: number, anchor: Coord, reserved: Map<string, number>, random: () => number): DriftBoat {
  reserved.set(keyOf(anchor), id);
  return { id, anchor, from: anchor, to: null, progress: 0, rest: MIN_REST + random() * (MAX_REST - MIN_REST), heading: Math.floor(random() * 4) * (Math.PI / 2) };
}

export function driftPosition(boat: DriftBoat): { x: number; z: number } {
  const to = boat.to ?? boat.from;
  return {
    x: boat.from.x + 0.5 + (to.x - boat.from.x) * boat.progress,
    z: boat.from.y + 0.5 + (to.y - boat.from.y) * boat.progress,
  };
}

export function releaseDrift(boat: DriftBoat, reserved: Map<string, number>): void {
  for (const tile of [boat.from, boat.to]) {
    if (tile && reserved.get(keyOf(tile)) === boat.id) reserved.delete(keyOf(tile));
  }
}

export function advanceDrift(boat: DriftBoat, deltaSeconds: number, { water, reserved, random }: DriftContext): void {
  if (!water.has(keyOf(boat.from))) {
    releaseDrift(boat, reserved);
    Object.assign(boat, { from: boat.anchor, to: null, progress: 0 });
    reserved.set(keyOf(boat.anchor), boat.id);
    return;
  }
  if (boat.to && !water.has(keyOf(boat.to))) {
    reserved.delete(keyOf(boat.to));
    Object.assign(boat, { to: null, progress: 0 });
  }
  if (boat.to) {
    boat.progress += DRIFT_SPEED * deltaSeconds;
    if (boat.progress < 1) return;
    reserved.delete(keyOf(boat.from));
    Object.assign(boat, { from: boat.to, to: null, progress: 0, rest: MIN_REST + random() * (MAX_REST - MIN_REST) });
    return;
  }
  boat.rest -= deltaSeconds;
  if (boat.rest > 0) return;
  const options = DIRECTIONS.map((step) => ({ x: boat.from.x + step.x, y: boat.from.y + step.y })).filter((tile) => water.has(keyOf(tile)) && !reserved.has(keyOf(tile)));
  const next = options[Math.floor(random() * options.length)];
  if (!next) {
    boat.rest = BLOCKED_REST;
    return;
  }
  reserved.set(keyOf(next), boat.id);
  Object.assign(boat, { to: next, progress: 0, heading: Math.atan2(next.x - boat.from.x, next.y - boat.from.y) });
}
