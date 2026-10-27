import type { Coord } from '../map/coord';
import type { Bridge } from '../engine/state';

export interface FootbridgeParts {
  stairs: [Coord, Coord];
  corridors: [Coord, Coord];
  deck: Coord[];
  alongside: Coord[];
}

function along(bridge: Bridge, index: number): Coord {
  return bridge.axis === 'x' ? { x: bridge.x + index, y: bridge.y } : { x: bridge.x, y: bridge.y + index };
}

function beside(bridge: Bridge, tile: Coord): Coord {
  const side = bridge.side ?? 1;
  return bridge.axis === 'x' ? { x: tile.x, y: tile.y + side } : { x: tile.x + side, y: tile.y };
}

// The deck runs on the lane of `x, y`; both corridors and the tiles beside the deck are on the lane next to it, on the `side` of the Bridge.
export function footbridgeParts(bridge: Bridge): FootbridgeParts {
  const deck = Array.from({ length: bridge.length }, (_, index) => along(bridge, index));
  const stairs: [Coord, Coord] = [along(bridge, -1), along(bridge, bridge.length)];
  return { stairs, corridors: [beside(bridge, stairs[0]), beside(bridge, stairs[1])], deck, alongside: deck.map((tile) => beside(bridge, tile)) };
}
