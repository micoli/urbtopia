import { bridgeEnds, bridgeTiles, tileKey, type Bridge, type Coord } from '../core';
import { edgeKey } from './vehicleTraffic';

export type BridgePhase = 'closed' | 'waiting' | 'opening' | 'open' | 'closing';

export interface BridgeOpening {
  phase: BridgePhase;
  openness: number;
  hold: number;
}

export interface OpeningInput {
  requested: boolean;
  occupied: boolean;
  deckBusy: boolean;
}

export const OPENING_SECONDS = 3;
export const CLOSING_SECONDS = 3;
export const MIN_OPEN_SECONDS = 1.5;
export const MAX_LEAF_ANGLE = (75 * Math.PI) / 180;

export const closedBridge = (): BridgeOpening => ({ phase: 'closed', openness: 0, hold: 0 });

export function leafSplit(length: number): number[] {
  const first = Math.ceil(length / 2);
  return length - first > 0 ? [first, length - first] : [first];
}

export interface LeafLayout {
  hinge: number;
  direction: 1 | -1;
  tiles: number;
}

export function leafLayout(length: number): LeafLayout[] {
  const [first = length, second] = leafSplit(length);
  const leaves: LeafLayout[] = [{ hinge: 0, direction: 1, tiles: first }];
  if (second !== undefined) leaves.push({ hinge: length, direction: -1, tiles: second });
  return leaves;
}

export function leafAngle(openness: number): number {
  const eased = openness * openness * (3 - 2 * openness);
  return eased * MAX_LEAF_ANGLE;
}

export function stepOpening(bridge: BridgeOpening, deltaSeconds: number, { requested, occupied, deckBusy }: OpeningInput): void {
  switch (bridge.phase) {
    case 'closed':
      if (requested) bridge.phase = 'waiting';
      return;
    case 'waiting':
      if (!requested) bridge.phase = 'closed';
      else if (!deckBusy) bridge.phase = 'opening';
      return;
    case 'opening':
      bridge.openness = Math.min(1, bridge.openness + deltaSeconds / OPENING_SECONDS);
      if (bridge.openness < 1) return;
      Object.assign(bridge, { phase: 'open', hold: MIN_OPEN_SECONDS });
      return;
    case 'open':
      bridge.hold -= deltaSeconds;
      if (requested || occupied || bridge.hold > 0) return;
      bridge.phase = 'closing';
      return;
    case 'closing':
      bridge.openness = Math.max(0, bridge.openness - deltaSeconds / CLOSING_SECONDS);
      if (bridge.openness > 0) return;
      bridge.phase = 'closed';
  }
}

export const isStoppingTraffic = (bridge: BridgeOpening): boolean => bridge.phase !== 'closed';

export const boatsMayPass = (bridge: BridgeOpening): boolean => bridge.phase === 'open';

export function gateEdges(bridge: Bridge): string[] {
  const tiles = bridgeTiles(bridge);
  const [before, after] = bridgeEnds(bridge);
  return [edgeKey(before, tiles[0]!), edgeKey(after, tiles[tiles.length - 1]!)];
}

interface Rolling {
  from: Coord;
  to: Coord;
  progress: number;
}

export function deckBusy(vehicles: readonly Rolling[], deck: ReadonlySet<string>): boolean {
  return vehicles.some((vehicle) => deck.has(tileKey(vehicle.progress < 0.5 ? vehicle.from : vehicle.to)));
}
