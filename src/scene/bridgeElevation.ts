import { bridgeRamps, isInfrastructureBridge, isPedestrianBridge, tileKey, type Bridge, type Coord } from '../core';

export const BRIDGE_CLEARANCE = 0.5;

// `from` and `to` are the tiles of the edge the vehicle drives: only an edge that starts or ends on a ramp is on the Bridge, never the Road or Railway beneath.
export type ElevationAt = (x: number, z: number, from: Coord, to: Coord) => number;

const flat: ElevationAt = () => 0;

// Same cubic Bezier with flat ends as the ramp model.
const smooth = (t: number): number => t * t * (3 - 2 * t);

// The deck of a Bridge over infrastructure rises over its first ramp, stays level over its span and falls over its last ramp.
export function bridgeElevation(bridges: readonly Bridge[] | undefined): ElevationAt {
  const vehicleBridges = (bridges ?? []).filter((bridge) => isInfrastructureBridge(bridge) && !isPedestrianBridge(bridge));
  const decks = vehicleBridges.map((bridge) => {
    const first = bridgeRamps(bridge)[0]!;
    return { alongX: bridge.axis === 'x', along: bridge.axis === 'x' ? first.x : first.y, across: bridge.axis === 'x' ? first.y : first.x, spans: bridge.length };
  });
  if (decks.length === 0) return flat;
  const ramps = new Set(vehicleBridges.flatMap(bridgeRamps).map(tileKey));
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

const PITCH_SAMPLE = 0.05;

// Nose-up angle (radians) of a vehicle heading `yaw`, for a rotation about its own X axis applied after the yaw.
export function bridgePitch(elevation: ElevationAt, x: number, z: number, yaw: number, from: Coord, to: Coord): number {
  const dx = Math.sin(yaw) * PITCH_SAMPLE;
  const dz = Math.cos(yaw) * PITCH_SAMPLE;
  const rise = elevation(x + dx, z + dz, from, to) - elevation(x - dx, z - dz, from, to);
  return -Math.atan2(rise, 2 * PITCH_SAMPLE);
}
