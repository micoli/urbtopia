import { tileKey, type Coord } from '../core';
import { isRoundaboutExit, neighboursOf, type RoadGraph } from './roadGraph';

export type TileWeight = (tile: Coord) => number;

const UNIFORM: TileWeight = () => 1;

export function chooseNextTile(graph: RoadGraph, current: Coord, previous: Coord | null, random: number, weight: TileWeight = UNIFORM): Coord {
  const neighbours = neighboursOf(graph, current);
  if (previous && !isRoundaboutExit(graph, current)) {
    const straight = { x: 2 * current.x - previous.x, y: 2 * current.y - previous.y };
    if (neighbours.some((tile) => tileKey(tile) === tileKey(straight))) return straight;
  }
  const forward = neighbours.filter((tile) => !previous || tileKey(tile) !== tileKey(previous));
  const options = forward.length > 0 ? forward : neighbours;
  const total = options.reduce((sum, tile) => sum + weight(tile), 0);
  let remaining = random * total;
  for (const tile of options) {
    remaining -= weight(tile);
    if (remaining < 0) return tile;
  }
  return options.at(-1) ?? current;
}
