import type { GameState } from '../engine/state';
import type { Coord } from './coord';
import { DIRECTIONS, neighbour, tileKey } from './geometry';
import { roadExits, roundaboutTiles } from './occupancy';

export interface RoadGraph extends ReadonlyMap<string, readonly Coord[]> {
  readonly roundaboutExits: ReadonlySet<string>;
}

export function emptyRoadGraph(): RoadGraph {
  return Object.assign(new Map<string, readonly Coord[]>(), { roundaboutExits: new Set<string>() });
}

export function buildRoadGraph(state: GameState): RoadGraph {
  const graph = Object.assign(new Map<string, readonly Coord[]>(), { roundaboutExits: new Set<string>() });
  for (const road of state.roads) {
    graph.set(
      tileKey(road),
      roadExits(state, road).map((direction) => neighbour(road, direction)),
    );
  }
  for (const center of state.roundabouts) addRing(graph, state, center);
  return graph;
}

export function isRoundaboutExit(graph: RoadGraph, tile: Coord): boolean {
  return graph.roundaboutExits.has(tileKey(tile));
}

export function neighboursOf(graph: RoadGraph, tile: Coord): readonly Coord[] {
  return graph.get(tileKey(tile)) ?? [];
}

function addRing(graph: Map<string, readonly Coord[]> & { roundaboutExits: Set<string> }, state: GameState, center: Coord): void {
  const ring = roundaboutTiles(center).filter((tile) => tile.x !== center.x || tile.y !== center.y);
  const ringKeys = new Set(ring.map(tileKey));
  const roadKeys = new Set(state.roads.map(tileKey));
  for (const tile of ring) {
    const around = DIRECTIONS.map((direction) => neighbour(tile, direction));
    const onRing = around.filter((next) => ringKeys.has(tileKey(next)));
    const entrances = isSideMiddle(tile, center) ? around.filter((next) => roadKeys.has(tileKey(next)) && !ringKeys.has(tileKey(next))) : [];
    graph.set(tileKey(tile), [...onRing, ...entrances]);
    if (entrances.length > 0) graph.roundaboutExits.add(tileKey(tile));
  }
}

function isSideMiddle(tile: Coord, center: Coord): boolean {
  return tile.x === center.x || tile.y === center.y;
}
