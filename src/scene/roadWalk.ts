import { tileKey, type Coord } from '../core';
import { isRoundaboutExit, neighboursOf, type RoadGraph } from './roadGraph';

export function chooseNextTile(graph: RoadGraph, current: Coord, previous: Coord | null, random: number): Coord {
  const neighbours = neighboursOf(graph, current);
  if (previous && !isRoundaboutExit(graph, current)) {
    const straight = { x: 2 * current.x - previous.x, y: 2 * current.y - previous.y };
    if (neighbours.some((tile) => tileKey(tile) === tileKey(straight))) return straight;
  }
  const forward = neighbours.filter((tile) => !previous || tileKey(tile) !== tileKey(previous));
  const options = forward.length > 0 ? forward : neighbours;
  return options[Math.floor(random * options.length)] ?? current;
}
