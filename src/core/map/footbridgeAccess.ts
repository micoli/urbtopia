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
function linksAcross(state: GameState, corridor: Coord, directions: readonly Direction[]): FootbridgeLink[] {
  const ways = new Set((state.pedestrianWays ?? []).map(tileKey));
  return directions.flatMap((direction): FootbridgeLink[] => {
    const tile = neighbour(corridor, direction);
    if (ways.has(tileKey(tile))) return [{ kind: 'way', tile }];
    const side = OPPOSITE[direction];
    const exits = exitsAt(state, tile);
    return exits && !exits.includes(side) ? [{ kind: 'sidewalk', tile, side }] : [];
  });
}

function axisDirections(bridge: Bridge): [Direction, Direction] {
  return bridge.axis === 'x' ? ['E', 'W'] : ['S', 'N'];
}

export function footbridgeEndLinks(state: GameState, bridge: Bridge): [FootbridgeLink[], FootbridgeLink[]] {
  const [forward, back] = axisDirections(bridge);
  const { corridors } = footbridgeParts(bridge);
  return [linksAcross(state, corridors[0], [forward, back]), linksAcross(state, corridors[1], [back, forward])];
}

// Whether each corridor reaches the network on the side of the deck (inner) and on the far side (outer).
export function footbridgeOpenSides(state: GameState, bridge: Bridge): [{ inner: boolean; outer: boolean }, { inner: boolean; outer: boolean }] {
  const [forward, back] = axisDirections(bridge);
  const { corridors } = footbridgeParts(bridge);
  const sides = (corridor: Coord, inner: Direction, outer: Direction) => ({ inner: linksAcross(state, corridor, [inner]).length > 0, outer: linksAcross(state, corridor, [outer]).length > 0 });
  return [sides(corridors[0], forward, back), sides(corridors[1], back, forward)];
}
