import { neighbour } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { Bridge } from '../engine/state';
import { footbridgeParts } from './footbridgeGeometry';

export const isInfrastructureBridge = (bridge: Bridge): boolean => bridge.carrier !== undefined;

export const isPedestrianBridge = (bridge: Bridge): boolean => bridge.carrier === 'pedestrian';

function along(bridge: Bridge): { forward: 'E' | 'S'; back: 'W' | 'N' } {
  return bridge.axis === 'x' ? { forward: 'E', back: 'W' } : { forward: 'S', back: 'N' };
}

// The tiles passed over: the deck of a Footbridge and the lane beside it.
export function bridgeTiles(bridge: Bridge): Coord[] {
  if (!isPedestrianBridge(bridge)) return bridgeDeck(bridge);
  const { deck, alongside } = footbridgeParts(bridge);
  return [...deck, ...alongside];
}

export function bridgeDeck(bridge: Bridge): Coord[] {
  return Array.from({ length: bridge.length }, (_, index) => (bridge.axis === 'x' ? { x: bridge.x + index, y: bridge.y } : { x: bridge.x, y: bridge.y + index }));
}

export function bridgeRamps(bridge: Bridge): Coord[] {
  if (!isInfrastructureBridge(bridge) || isPedestrianBridge(bridge)) return [];
  const tiles = bridgeTiles(bridge);
  const { forward, back } = along(bridge);
  return [neighbour(tiles[0]!, back), neighbour(tiles[tiles.length - 1]!, forward)];
}

export function bridgeFootprint(bridge: Bridge): Coord[] {
  if (isPedestrianBridge(bridge)) {
    const { stairs, corridors } = footbridgeParts(bridge);
    return [...stairs, ...corridors, ...bridgeTiles(bridge)];
  }
  if (!isInfrastructureBridge(bridge)) return bridgeTiles(bridge);
  const ramps = bridgeRamps(bridge);
  return [ramps[0]!, ...bridgeTiles(bridge), ramps[1]!];
}

export function bridgeEnds(bridge: Bridge): [Coord, Coord] {
  const { forward, back } = along(bridge);
  if (isPedestrianBridge(bridge)) {
    const { corridors } = footbridgeParts(bridge);
    return [neighbour(corridors[0], back), neighbour(corridors[1], forward)];
  }
  const footprint = bridgeFootprint(bridge);
  return [neighbour(footprint[0]!, back), neighbour(footprint[footprint.length - 1]!, forward)];
}
