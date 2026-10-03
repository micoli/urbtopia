import { DIRECTIONS, neighbour, roadExits, roundaboutTiles, tileKey, type Coord, type GameState } from '../core';

export type RoadGraph = ReadonlyMap<string, readonly Coord[]>;

export function buildRoadGraph(state: GameState): RoadGraph {
  const graph = new Map<string, Coord[]>();
  for (const road of state.roads) {
    graph.set(
      tileKey(road),
      roadExits(state, road).map((direction) => neighbour(road, direction)),
    );
  }
  for (const center of state.roundabouts) addRing(graph, state, center);
  return graph;
}

export function neighboursOf(graph: RoadGraph, tile: Coord): readonly Coord[] {
  return graph.get(tileKey(tile)) ?? [];
}

function addRing(graph: Map<string, Coord[]>, state: GameState, center: Coord): void {
  const ring = roundaboutTiles(center).filter((tile) => tile.x !== center.x || tile.y !== center.y);
  const ringKeys = new Set(ring.map(tileKey));
  const roadKeys = new Set(state.roads.map(tileKey));
  for (const tile of ring) {
    const around = DIRECTIONS.map((direction) => neighbour(tile, direction));
    const onRing = around.filter((next) => ringKeys.has(tileKey(next)));
    const entrances = isSideMiddle(tile, center) ? around.filter((next) => roadKeys.has(tileKey(next)) && !ringKeys.has(tileKey(next))) : [];
    graph.set(tileKey(tile), [...onRing, ...entrances]);
  }
}

function isSideMiddle(tile: Coord, center: Coord): boolean {
  return tile.x === center.x || tile.y === center.y;
}
