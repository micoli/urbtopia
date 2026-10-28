import { footprintTiles } from '../buildings/buildingSpecs';
import type { Bridge, Building, GameState } from '../engine/state';
import type { Coord } from './coord';
import { DIRECTIONS, frontDirection, neighbour, tileKey, type Direction } from './geometry';
import { roadExits, roundaboutTiles } from './occupancy';
import { frontTiles } from './placement';
import { bridgeFootprint, bridgeRamps, isPedestrianBridge } from '../water/bridgeGeometry';
import { footbridgeParts } from '../water/footbridgeGeometry';
import { footbridgeEndLinks } from './footbridgeAccess';

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

const graphCache = new WeakMap<GameState['roads'], { roundabouts: GameState['roundabouts']; pedestrianWays: GameState['pedestrianWays']; brtRoads: GameState['brtRoads']; bridges: GameState['bridges']; graph: PedestrianGraph }>();

export function pedestrianGraph(state: GameState): PedestrianGraph {
  const cached = graphCache.get(state.roads);
  if (cached?.roundabouts === state.roundabouts && cached.pedestrianWays === state.pedestrianWays && cached.brtRoads === state.brtRoads && cached.bridges === state.bridges) return cached.graph;
  const graph = buildPedestrianGraph(state);
  graphCache.set(state.roads, { roundabouts: state.roundabouts, pedestrianWays: state.pedestrianWays, brtRoads: state.brtRoads, bridges: state.bridges, graph });
  return graph;
}

export function sidewalkNode(tile: Coord, side: Direction | 'R'): string {
  return `${tileKey(tile)}:${side}`;
}

export function pedestrianWayNode(tile: Coord): string {
  return `${tileKey(tile)}:P`;
}

export function buildPedestrianGraph(state: GameState): PedestrianGraph {
  const edges = new Map<string, PedestrianEdge[]>();
  const roads = new Map<string, { x: number; y: number; kind?: string }>(state.roads.map((road) => [tileKey(road), road]));
  const exitsOf = new Map<string, readonly Direction[]>(state.roads.map((road) => [tileKey(road), roadExits(state, road)]));
  for (const tile of state.brtRoads ?? []) {
    if (roads.has(tileKey(tile))) continue;
    roads.set(tileKey(tile), tile);
    exitsOf.set(tileKey(tile), tile.exits);
  }
  const ways = new Map((state.pedestrianWays ?? []).map((tile) => [tileKey(tile), tile]));
  const link = (a: string, b: string, cost: number, crossing: string | null = null) => {
    if (a === b) return;
    addEdge(edges, a, { to: b, cost, crossing });
    addEdge(edges, b, { to: a, cost, crossing });
  };
  const hasSide = (tile: Coord, side: Direction): boolean => {
    const exits = exitsOf.get(tileKey(tile));
    return exits !== undefined && !exits.includes(side);
  };

  for (const road of roads.values()) {
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

    for (const side of free) {
      const beside = neighbour(road, side);
      if (hasSide(beside, OPPOSITE[side])) link(sidewalkNode(road, side), sidewalkNode(beside, OPPOSITE[side]), 1);
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

  for (const bridge of (state.bridges ?? []).filter(isPedestrianBridge)) addFootbridge(edges, state, bridge, link);

  for (const bridge of state.bridges ?? []) {
    const [first, last] = bridgeRamps(bridge);
    if (!first || !last) continue;
    for (const side of bridge.axis === 'x' ? (['N', 'S'] as const) : (['E', 'W'] as const)) link(sidewalkNode(first, side), sidewalkNode(last, side), bridge.length + 1);
  }

  for (const way of ways.values()) {
    const node = pedestrianWayNode(way);
    addNode(edges, node);
    const neighbours = DIRECTIONS.map((direction) => neighbour(way, direction));
    const wayNeighbours = neighbours.filter((tile) => ways.has(tileKey(tile)));
    for (const next of wayNeighbours) link(node, pedestrianWayNode(next), 1);
    if (wayNeighbours.length > 1) continue;
    for (const roadSide of DIRECTIONS) {
      const road = roads.get(tileKey(neighbour(way, OPPOSITE[roadSide])));
      if (!road || exitsOf.get(tileKey(road))?.includes(roadSide)) continue;
      link(node, sidewalkNode(road, roadSide), 1);
    }
  }

  return edges;
}

// The walk goes corridor, stair, deck tiles, stair, corridor, one node per tile so that walkers follow the stairs and the deck. It costs `span + 3` from corridor to corridor, and nothing beside it joins it.
function addFootbridge(edges: Map<string, PedestrianEdge[]>, state: GameState, bridge: Bridge, link: (a: string, b: string, cost: number) => void): void {
  const { corridors, stairs, deck } = footbridgeParts(bridge);
  const route = [corridors[0], stairs[0], ...deck, stairs[1], corridors[1]].map(pedestrianWayNode);
  for (const node of route) addNode(edges, node);
  route.slice(1).forEach((node, index) => link(route[index]!, node, 1));
  const ends = [route[0]!, route[route.length - 1]!];
  footbridgeEndLinks(state, bridge).forEach((links, end) => {
    for (const reach of links) link(ends[end]!, reach.kind === 'way' ? pedestrianWayNode(reach.tile) : sidewalkNode(reach.tile, reach.side), 1);
  });
}

// Where the Street view halts on a Footbridge: the middle of its deck, to look around from the top.
export function footbridgeStops(state: GameState): ReadonlySet<string> {
  return new Set((state.bridges ?? []).filter(isPedestrianBridge).map((bridge) => pedestrianWayNode(footbridgeParts(bridge).deck[Math.floor((bridge.length - 1) / 2)]!)));
}

function footbridgeTileKeys(state: GameState): ReadonlySet<string> {
  return new Set((state.bridges ?? []).filter(isPedestrianBridge).flatMap(bridgeFootprint).map(tileKey));
}

export function accessNodes(state: GameState, graph: PedestrianGraph, building: Building): string[] {
  const corridors = footbridgeTileKeys(state);
  const back = OPPOSITE[frontDirection(building.rotation)];
  const nodes: string[] = [];
  for (const tile of frontTiles(building.type, building.x, building.y, building.rotation, building.tier)) {
    for (const node of [sidewalkNode(tile, back), sidewalkNode(tile, 'R'), pedestrianWayNode(tile)]) {
      if (graph.has(node) && !corridors.has(tileKey(tile))) nodes.push(node);
    }
  }
  return nodes;
}

// Where Citizens walking to work reach a workplace: its front, and any Pedestrian way along it.
export function workAccessNodes(state: GameState, graph: PedestrianGraph, building: Building): string[] {
  const front = accessNodes(state, graph, building);
  const ways = adjacentNodes(state, graph, building).filter((node) => node.endsWith(':P'));
  return [...new Set([...front, ...ways])];
}

export function adjacentNodes(state: GameState, graph: PedestrianGraph, building: Building): string[] {
  const corridors = footbridgeTileKeys(state);
  const inside = new Set(footprintTiles(building).map(tileKey));
  const nodes = new Set<string>();
  for (const tile of footprintTiles(building)) {
    for (const direction of DIRECTIONS) {
      const outside = neighbour(tile, direction);
      if (inside.has(tileKey(outside)) || corridors.has(tileKey(outside))) continue;
      for (const node of [sidewalkNode(outside, OPPOSITE[direction]), sidewalkNode(outside, 'R'), pedestrianWayNode(outside)]) {
        if (graph.has(node)) nodes.add(node);
      }
    }
  }
  return [...nodes].sort();
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

export function nodesOnPath(map: WalkMap, node: string): string[] {
  const nodes = [node];
  for (let step = map.parents.get(node); step !== undefined; step = map.parents.get(step.from)) nodes.push(step.from);
  return nodes;
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
