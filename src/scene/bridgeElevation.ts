import { bridgeRamps, isInfrastructureBridge, type Bridge } from '../core';

export const BRIDGE_CLEARANCE = 0.5;

export type ElevationAt = (x: number, z: number) => number;

const flat: ElevationAt = () => 0;

// The deck of a Bridge over infrastructure rises over its first ramp, stays level over its span and falls over its last ramp.
export function bridgeElevation(bridges: readonly Bridge[] | undefined): ElevationAt {
  const decks = (bridges ?? []).filter(isInfrastructureBridge).map((bridge) => {
    const first = bridgeRamps(bridge)[0]!;
    return { alongX: bridge.axis === 'x', along: bridge.axis === 'x' ? first.x : first.y, across: bridge.axis === 'x' ? first.y : first.x, spans: bridge.length };
  });
  if (decks.length === 0) return flat;
  return (x, z) => {
    for (const deck of decks) {
      const [along, across] = deck.alongX ? [x, z] : [z, x];
      if (across < deck.across || across >= deck.across + 1) continue;
      const offset = along - deck.along;
      if (offset < 0 || offset > deck.spans + 2) continue;
      return BRIDGE_CLEARANCE * Math.min(1, offset, deck.spans + 2 - offset);
    }
    return 0;
  };
}
