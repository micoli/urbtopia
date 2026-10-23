import { bridgeRamps, isInfrastructureBridge, tileKey, type Bridge, type Coord } from '../core';

export const BRIDGE_CLEARANCE = 0.5;

// `from` and `to` are the tiles of the edge the vehicle drives: only an edge that starts or ends on a ramp is on the Bridge, never the Road or Railway beneath.
export type ElevationAt = (x: number, z: number, from: Coord, to: Coord) => number;

const flat: ElevationAt = () => 0;

// Same cubic Bezier with flat ends as the ramp model.
const smooth = (t: number): number => t * t * (3 - 2 * t);

// The deck of a Bridge over infrastructure rises over its first ramp, stays level over its span and falls over its last ramp.
export function bridgeElevation(bridges: readonly Bridge[] | undefined): ElevationAt {
  const decks = (bridges ?? []).filter(isInfrastructureBridge).map((bridge) => {
    const first = bridgeRamps(bridge)[0]!;
    return { alongX: bridge.axis === 'x', along: bridge.axis === 'x' ? first.x : first.y, across: bridge.axis === 'x' ? first.y : first.x, spans: bridge.length };
  });
  if (decks.length === 0) return flat;
  const ramps = new Set((bridges ?? []).filter(isInfrastructureBridge).flatMap(bridgeRamps).map(tileKey));
  return (x, z, from, to) => {
    if (!ramps.has(tileKey(from)) && !ramps.has(tileKey(to))) return 0;
    for (const deck of decks) {
      const [along, across] = deck.alongX ? [x, z] : [z, x];
      if (across < deck.across || across >= deck.across + 1) continue;
      const offset = along - deck.along;
      if (offset < 0 || offset > deck.spans + 2) continue;
      return BRIDGE_CLEARANCE * smooth(Math.min(1, offset, deck.spans + 2 - offset));
    }
    return 0;
  };
}
