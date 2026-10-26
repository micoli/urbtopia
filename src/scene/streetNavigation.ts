import { walkFrom, type PedestrianGraph, type WalkMap } from '../core';
import { nodePosition } from './pedestrianWalk';

export const EYE_HEIGHT = 0.28;
const MAX_TURN = (70 * Math.PI) / 180;
const STRAIGHT = (20 * Math.PI) / 180;
const MAX_JUMP = 3;
const SIGHT_COST = 14;
const SIGHT_DISTANCE = 10;

export interface Heading {
  x: number;
  z: number;
}

export function yawBetween(from: string, to: string): number {
  const a = nodePosition(from);
  const b = nodePosition(to);
  return Math.atan2(b.x - a.x, b.z - a.z);
}

export function nearestNode(graph: PedestrianGraph, x: number, z: number, maxDistance = Infinity): string | null {
  let best: string | null = null;
  let bestDistance = maxDistance;
  for (const node of graph.keys()) {
    const position = nodePosition(node);
    const distance = Math.hypot(position.x - x, position.z - z);
    if (distance < bestDistance || (distance === bestDistance && best !== null && node < best)) {
      best = node;
      bestDistance = distance;
    }
  }
  return best;
}

export function neighbourNodes(graph: PedestrianGraph, node: string): string[] {
  return (graph.get(node) ?? []).map((edge) => edge.to).filter((next) => next !== node && yawDistance(node, next) > 0);
}

export function nextNode(graph: PedestrianGraph, node: string, yaw: number): string | null {
  let best: string | null = null;
  let bestTurn = MAX_TURN;
  for (const next of neighbourNodes(graph, node)) {
    const turn = Math.abs(normalizeAngle(yawBetween(node, next) - yaw));
    if (turn < bestTurn || (turn === bestTurn && best !== null && next < best)) {
      best = next;
      bestTurn = turn;
    }
  }
  return best;
}

// Each path starts after `node` and runs straight on, up to MAX_JUMP nodes, until a branch or a bend.
export function jumpPaths(graph: PedestrianGraph, node: string): string[][] {
  return neighbourNodes(graph, node).map((first) => extend(graph, [node, first]).slice(1));
}

export function nextJump(graph: PedestrianGraph, node: string, yaw: number): string[] | null {
  let best: string[] | null = null;
  let bestTurn = MAX_TURN;
  for (const path of jumpPaths(graph, node)) {
    const turn = Math.abs(normalizeAngle(yawBetween(node, path[0]!) - yaw));
    if (turn < bestTurn) {
      best = path;
      bestTurn = turn;
    }
  }
  return best;
}

export interface Sighting {
  node: string;
  path: string[];
}

// The nearest sidewalk node of every Pedestrian crossing reachable on foot, with the way to walk there.
export function crossingSightings(graph: PedestrianGraph, node: string): Sighting[] {
  const map = walkFrom(graph, [node], SIGHT_COST);
  const nearest = new Map<string, { node: string; cost: number }>();
  for (const [from, cost] of map.costs) {
    for (const edge of graph.get(from) ?? []) {
      if (edge.crossing === null) continue;
      const known = nearest.get(edge.crossing);
      if (!known || cost < known.cost || (cost === known.cost && from < known.node)) nearest.set(edge.crossing, { node: from, cost });
    }
  }
  const here = nodePosition(node);
  return [...nearest.values()]
    .filter(({ node: target }) => target !== node && Math.hypot(nodePosition(target).x - here.x, nodePosition(target).z - here.z) <= SIGHT_DISTANCE)
    .sort((a, b) => a.cost - b.cost || (a.node < b.node ? -1 : 1))
    .map(({ node: target }) => ({ node: target, path: pathTo(map, target) }));
}

function pathTo(map: WalkMap, target: string): string[] {
  const path = [target];
  for (let step = map.parents.get(target); step !== undefined; step = map.parents.get(step.from)) path.unshift(step.from);
  return path.slice(1);
}

function extend(graph: PedestrianGraph, path: string[]): string[] {
  while (path.length - 1 < MAX_JUMP) {
    const here = path.at(-1)!;
    const before = path.at(-2)!;
    const onward = neighbourNodes(graph, here).filter((next) => next !== before);
    const next = onward[0];
    if (onward.length !== 1 || next === undefined) break;
    if (Math.abs(normalizeAngle(yawBetween(here, next) - yawBetween(before, here))) > STRAIGHT) break;
    path.push(next);
  }
  return path;
}

function yawDistance(from: string, to: string): number {
  const a = nodePosition(from);
  const b = nodePosition(to);
  return Math.hypot(b.x - a.x, b.z - a.z);
}

export function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
