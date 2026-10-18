import { footprintOf } from '../buildings/buildingSpecs';
import type { Building, GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { DIRECTIONS, neighbour, tileKey } from '../map/geometry';
import { buildRoadGraph } from '../map/roadGraph';
import { pedestrianGraph, pedestrianWayNode } from '../map/pedestrianGraph';
import { WASTE, wasteKindOf } from './wasteBalance';

export type RoadComponents = ReadonlyMap<string, number>;

export function footprintOfBuilding(building: Pick<Building, 'type' | 'rotation' | 'tier'>): { width: number; depth: number } {
  const kind = wasteKindOf(building.type);
  if (!kind) return footprintOf(building.type, building.rotation, building.tier);
  const { width, depth } = WASTE.facilities[kind].footprint;
  return building.rotation % 2 === 0 ? { width, depth } : { width: depth, depth: width };
}

export function tilesOfBuilding(building: Pick<Building, 'type' | 'rotation' | 'tier' | 'x' | 'y'>): Coord[] {
  const { width, depth } = footprintOfBuilding(building);
  return Array.from({ length: width * depth }, (_, index) => ({ x: building.x + (index % width), y: building.y + Math.floor(index / width) }));
}

export function outsideNeighbours(tiles: readonly Coord[]): Coord[] {
  const inside = new Set(tiles.map(tileKey));
  const outside = new Map<string, Coord>();
  for (const tile of tiles) {
    for (const direction of DIRECTIONS) {
      const next = neighbour(tile, direction);
      if (!inside.has(tileKey(next))) outside.set(tileKey(next), next);
    }
  }
  return [...outside.values()];
}

// Road tiles joined by the Road network share a component number.
export function roadComponents(state: GameState): RoadComponents {
  const graph = buildRoadGraph(state);
  const links = new Map<string, string[]>();
  for (const [key, next] of graph) {
    links.set(key, [...(links.get(key) ?? []), ...next.map(tileKey)]);
    for (const other of next) links.set(tileKey(other), [...(links.get(tileKey(other)) ?? []), key]);
  }
  const components = new Map<string, number>();
  let count = 0;
  for (const start of graph.keys()) {
    if (components.has(start)) continue;
    const pending = [start];
    components.set(start, count);
    for (let key = pending.pop(); key !== undefined; key = pending.pop()) {
      for (const next of links.get(key) ?? []) {
        if (components.has(next)) continue;
        components.set(next, count);
        pending.push(next);
      }
    }
    count++;
  }
  return components;
}

export function touchedRoadComponents(components: RoadComponents, tiles: readonly Coord[]): Set<number> {
  const touched = new Set<number>();
  for (const tile of outsideNeighbours(tiles)) {
    const component = components.get(tileKey(tile));
    if (component !== undefined) touched.add(component);
  }
  return touched;
}

// For each Road component the Pedestrian ways touching the tiles lead to, the shortest walk to it along the Pedestrian path network, ending on its sidewalk.
export function pedestrianDistances(state: GameState, components: RoadComponents, tiles: readonly Coord[], maxDistance: number): Map<number, number> {
  const graph = pedestrianGraph(state);
  const distances = new Map<string, number>();
  let frontier = outsideNeighbours(tiles).map(pedestrianWayNode).filter(node => graph.has(node));
  for (const node of frontier) distances.set(node, 0);
  const reached = new Map<number, number>();
  for (let distance = 0; frontier.length > 0 && distance < maxDistance; distance++) {
    const next: string[] = [];
    for (const node of frontier) {
      for (const { to } of graph.get(node) ?? []) {
        if (!to.endsWith(':P')) {
          const component = components.get(to.slice(0, to.lastIndexOf(':')));
          if (component !== undefined && !reached.has(component)) reached.set(component, distance + 1);
          continue;
        }
        if (distances.has(to)) continue;
        distances.set(to, distance + 1);
        next.push(to);
      }
    }
    frontier = next;
  }
  return reached;
}
