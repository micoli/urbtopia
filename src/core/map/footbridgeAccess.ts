import type { Bridge, GameState } from '../engine/state';
import { footbridgeParts } from '../water/footbridgeGeometry';
import type { Coord } from './coord';
import { neighbour, tileKey, type Direction } from './geometry';
import { roadExits } from './occupancy';

export type FootbridgeLink = { kind: 'sidewalk'; tile: Coord; side: Direction } | { kind: 'way'; tile: Coord };

const OPPOSITE: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };

function exitsAt(state: GameState, tile: Coord): readonly Direction[] | undefined {
  const key = tileKey(tile);
  if (state.roads.some((road) => tileKey(road) === key)) return roadExits(state, tile);
  return (state.brtRoads ?? []).find((brt) => tileKey(brt) === key)?.exits;
}

// A corridor reaches the pedestrian network through its neighbours along the Bridge axis only: a free Sidewalk side of a Road, or a Pedestrian way.
export function footbridgeEndLinks(state: GameState, bridge: Bridge): [FootbridgeLink[], FootbridgeLink[]] {
  const [forward, back]: [Direction, Direction] = bridge.axis === 'x' ? ['E', 'W'] : ['S', 'N'];
  const { corridors } = footbridgeParts(bridge);
  const ways = new Set((state.pedestrianWays ?? []).map(tileKey));
  const linksOf = (corridor: Coord, directions: readonly Direction[]): FootbridgeLink[] =>
    directions.flatMap((direction): FootbridgeLink[] => {
      const tile = neighbour(corridor, direction);
      if (ways.has(tileKey(tile))) return [{ kind: 'way', tile }];
      const side = OPPOSITE[direction];
      const exits = exitsAt(state, tile);
      return exits && !exits.includes(side) ? [{ kind: 'sidewalk', tile, side }] : [];
    });
  return [linksOf(corridors[0], [forward, back]), linksOf(corridors[1], [back, forward])];
}
