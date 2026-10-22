import { neighbour } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { Bridge } from '../engine/state';

export const isInfrastructureBridge = (bridge: Bridge): boolean => bridge.carrier !== undefined;

function along(bridge: Bridge): { forward: 'E' | 'S'; back: 'W' | 'N' } {
  return bridge.axis === 'x' ? { forward: 'E', back: 'W' } : { forward: 'S', back: 'N' };
}

export function bridgeTiles(bridge: Bridge): Coord[] {
  return Array.from({ length: bridge.length }, (_, index) => (bridge.axis === 'x' ? { x: bridge.x + index, y: bridge.y } : { x: bridge.x, y: bridge.y + index }));
}

export function bridgeRamps(bridge: Bridge): Coord[] {
  if (!isInfrastructureBridge(bridge)) return [];
  const tiles = bridgeTiles(bridge);
  const { forward, back } = along(bridge);
  return [neighbour(tiles[0]!, back), neighbour(tiles[tiles.length - 1]!, forward)];
}

export function bridgeFootprint(bridge: Bridge): Coord[] {
  if (!isInfrastructureBridge(bridge)) return bridgeTiles(bridge);
  const ramps = bridgeRamps(bridge);
  return [ramps[0]!, ...bridgeTiles(bridge), ramps[1]!];
}

export function bridgeEnds(bridge: Bridge): [Coord, Coord] {
  const { forward, back } = along(bridge);
  const footprint = bridgeFootprint(bridge);
  return [neighbour(footprint[0]!, back), neighbour(footprint[footprint.length - 1]!, forward)];
}
