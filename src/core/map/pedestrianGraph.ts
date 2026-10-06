import type { Building, GameState } from '../engine/state';
import type { Coord } from './coord';
import { DIRECTIONS, frontDirection, neighbour, tileKey, type Direction } from './geometry';
import { roadExits, roundaboutTiles } from './occupancy';
import { frontTiles } from './placement';

export const WALK = { crossingExtraCost: 2 };

export interface PedestrianEdge {
  to: string;
  cost: number;
  crossing: string | null;
}

export type PedestrianGraph = ReadonlyMap<string, readonly PedestrianEdge[]>;

export interface WalkMap {
  costs: ReadonlyMap<string, number>;
  parents: ReadonlyMap<string, { from: string; crossing: string | null }>;
}

export interface WalkTarget {
  node: string;
  cost: number;
}

const OPPOSITE: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };

const graphCache = new WeakMap<GameState['roads'], { roundabouts: GameState['roundabouts']; graph: PedestrianGraph }>();

export function pedestrianGraph(state: GameState): PedestrianGraph {
  const cached = graphCache.get(state.roads);
  if (cached?.roundabouts === state.roundabouts) return cached.graph;
  const graph = buildPedestrianGraph(state);
  graphCache.set(state.roads, { roundabouts: state.roundabouts, graph });
  return graph;
}

export function sidewalkNode(tile: Coord, side: Direction | 'R'): string {
  return `${tileKey(tile)}:${side}`;
}

export function buildPedestrianGraph(state: GameState): PedestrianGraph {
  const edges = new Map<string, PedestrianEdge[]>();
  const roads = new Map(state.roads.map((road) => [tileKey(road), road]));
  const exitsOf = new Map(state.roads.map((road) => [tileKey(road), roadExits(state, road)]));
  const link = (a: string, b: string, cost: number, crossing: string | null = null) => {
    if (a === b) return;
    addEdge(edges, a, { to: b, cost, crossing });
    addEdge(edges, b, { to: a, cost, crossing });
  };
  const hasSide = (tile: Coord, side: Direction): boolean => {
    const exits = exitsOf.get(tileKey(tile));
    return exits !== undefined && !exits.includes(side);
  };

  for (const road of state.roads) {
    const exits = exitsOf.get(tileKey(road)) ?? [];
    const free = DIRECTIONS.filter((side) => !exits.includes(side));
    for (const side of free) addNode(edges, sidewalkNode(road, side));

    for (const exit of exits) {
      const next = neighbour(road, exit);
      if (!roads.has(tileKey(next))) continue;
      for (const side of free) {
        if (side === OPPOSITE[exit] || !hasSide(next, side)) continue;
        link(sidewalkNode(road, side), sidewalkNode(next, side), 1);
      }
    }

    for (const [index, first] of free.entries()) {
      for (const second of free.slice(index + 1)) {
        if (OPPOSITE[first] === second) continue;
        link(sidewalkNode(road, first), sidewalkNode(road, second), 1);
      }
    }

    if (roads.get(tileKey(road))?.kind === 'crossing' && isStraight(exits)) {
      const [first, second] = free;
      if (first && second) link(sidewalkNode(road, first), sidewalkNode(road, second), 1 + WALK.crossingExtraCost, tileKey(road));
    }

    for (const [index, first] of exits.entries()) {
      for (const second of exits.slice(index + 1)) {
        if (OPPOSITE[first] === second) continue;
        const firstNext = neighbour(road, first);
        const secondNext = neighbour(road, second);
        if (!hasSide(firstNext, second) || !hasSide(secondNext, first)) continue;
        link(sidewalkNode(firstNext, second), sidewalkNode(secondNext, first), 1);
      }
    }
  }

  for (const center of state.roundabouts) addRing(edges, roads, exitsOf, center, link);
  return edges;
}

export function accessNodes(state: GameState, graph: PedestrianGraph, building: Building): string[] {
  const back = OPPOSITE[frontDirection(building.rotation)];
  const nodes: string[] = [];
  for (const tile of frontTiles(building.type, building.x, building.y, building.rotation, building.tier)) {
    for (const node of [sidewalkNode(tile, back), sidewalkNode(tile, 'R')]) {
      if (graph.has(node)) nodes.push(node);
    }
  }
  return nodes;
}

export function walkFrom(graph: PedestrianGraph, sources: readonly string[], maxCost: number): WalkMap {
  const costs = new Map<string, number>();
  const parents = new Map<string, { from: string; crossing: string | null }>();
  const buckets: string[][] = Array.from({ length: maxCost + 1 }, () => []);
  for (const source of sources) {
    if (costs.has(source)) continue;
    costs.set(source, 0);
    buckets[0]!.push(source);
  }
  for (let cost = 0; cost <= maxCost; cost++) {
    for (const node of buckets[cost]!) {
      if (costs.get(node) !== cost) continue;
      for (const edge of graph.get(node) ?? []) {
        const total = cost + edge.cost;
        if (total > maxCost) continue;
        const known = costs.get(edge.to);
        if (known !== undefined && known <= total) continue;
        costs.set(edge.to, total);
        parents.set(edge.to, { from: node, crossing: edge.crossing });
        buckets[total]!.push(edge.to);
      }
    }
  }
  return { costs, parents };
}

export function nearestTarget(map: WalkMap, targets: readonly string[]): WalkTarget | null {
  let best: WalkTarget | null = null;
  for (const node of targets) {
    const cost = map.costs.get(node);
    if (cost === undefined) continue;
    if (best === null || cost < best.cost || (cost === best.cost && node < best.node)) best = { node, cost };
  }
  return best;
}

export function crossingsOnPath(map: WalkMap, node: string): string[] {
  const crossings: string[] = [];
  for (let step = map.parents.get(node); step !== undefined; step = map.parents.get(step.from)) {
    if (step.crossing !== null) crossings.push(step.crossing);
  }
  return crossings;
}

function addNode(edges: Map<string, PedestrianEdge[]>, node: string): void {
  if (!edges.has(node)) edges.set(node, []);
}

function addEdge(edges: Map<string, PedestrianEdge[]>, from: string, edge: PedestrianEdge): void {
  const list = edges.get(from) ?? [];
  if (!list.some((known) => known.to === edge.to)) list.push(edge);
  edges.set(from, list);
}

function isStraight(exits: readonly Direction[]): boolean {
  const [first, second] = exits;
  return exits.length === 2 && first !== undefined && second !== undefined && OPPOSITE[first] === second;
}

function addRing(
  edges: Map<string, PedestrianEdge[]>,
  roads: ReadonlyMap<string, unknown>,
  exitsOf: ReadonlyMap<string, readonly Direction[]>,
  center: Coord,
  link: (a: string, b: string, cost: number) => void,
): void {
  const ring = roundaboutTiles(center).filter((tile) => tile.x !== center.x || tile.y !== center.y);
  const ringKeys = new Set(ring.map(tileKey));
  for (const tile of ring) {
    addNode(edges, sidewalkNode(tile, 'R'));
    for (const direction of DIRECTIONS) {
      const next = neighbour(tile, direction);
      if (ringKeys.has(tileKey(next))) link(sidewalkNode(tile, 'R'), sidewalkNode(next, 'R'), 1);
    }
  }
  const middles = ring.filter((tile) => tile.x === center.x || tile.y === center.y);
  for (const middle of middles) {
    for (const out of DIRECTIONS) {
      const entrance = neighbour(middle, out);
      if (ringKeys.has(tileKey(entrance)) || !roads.has(tileKey(entrance))) continue;
      for (const side of DIRECTIONS) {
        if (side === out || side === OPPOSITE[out]) continue;
        if (exitsOf.get(tileKey(entrance))?.includes(side)) continue;
        const corner = neighbour(middle, side);
        if (!ringKeys.has(tileKey(corner))) continue;
        link(sidewalkNode(entrance, side), sidewalkNode(corner, 'R'), 1);
      }
    }
  }
}
