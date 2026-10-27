import { bridgeRamps, footbridgeParts, isInfrastructureBridge, isPedestrianBridge, tileKey, type Bridge, type Coord } from '../core';

export const BRIDGE_CLEARANCE = 0.5;

// `from` and `to` are the tiles of the edge the vehicle drives: only an edge that starts or ends on a ramp is on the Bridge, never the Road or Railway beneath.
export type ElevationAt = (x: number, z: number, from: Coord, to: Coord) => number;

const flat: ElevationAt = () => 0;

// Same cubic Bezier with flat ends as the ramp model.
const smooth = (t: number): number => t * t * (3 - 2 * t);

const LANDING_HEIGHT = BRIDGE_CLEARANCE / 2;

// The walk of a Footbridge: a corridor on the ground, a stair whose landing is half way up, then the deck tiles, the other stair and corridor.
function footbridgeWalks(bridges: readonly Bridge[]): { heights: Map<string, number>; steps: Map<string, { from: Coord; to: Coord; rise: readonly [number, number] }> } {
  const heights = new Map<string, number>();
  const steps = new Map<string, { from: Coord; to: Coord; rise: readonly [number, number] }>();
  for (const bridge of bridges.filter(isPedestrianBridge)) {
    const { corridors, stairs, deck } = footbridgeParts(bridge);
    const route = [
      { tile: corridors[0], height: 0 },
      { tile: stairs[0], height: LANDING_HEIGHT },
      ...deck.map((tile) => ({ tile, height: BRIDGE_CLEARANCE })),
      { tile: stairs[1], height: LANDING_HEIGHT },
      { tile: corridors[1], height: 0 },
    ];
    route.forEach(({ tile, height }, index) => {
      heights.set(tileKey(tile), height);
      const next = route[index + 1];
      if (!next) return;
      steps.set(`${tileKey(tile)}>${tileKey(next.tile)}`, { from: tile, to: next.tile, rise: [height, next.height] });
      steps.set(`${tileKey(next.tile)}>${tileKey(tile)}`, { from: next.tile, to: tile, rise: [next.height, height] });
    });
  }
  return { heights, steps };
}

// The deck of a Bridge over infrastructure rises over its first ramp, stays level over its span and falls over its last ramp.
export function bridgeElevation(bridges: readonly Bridge[] | undefined): ElevationAt {
  const vehicleBridges = (bridges ?? []).filter((bridge) => isInfrastructureBridge(bridge) && !isPedestrianBridge(bridge));
  const decks = vehicleBridges.map((bridge) => {
    const first = bridgeRamps(bridge)[0]!;
    return { alongX: bridge.axis === 'x', along: bridge.axis === 'x' ? first.x : first.y, across: bridge.axis === 'x' ? first.y : first.x, spans: bridge.length };
  });
  const walks = footbridgeWalks(bridges ?? []);
  if (decks.length === 0 && walks.heights.size === 0) return flat;
  const ramps = new Set(vehicleBridges.flatMap(bridgeRamps).map(tileKey));
  return (x, z, from, to) => {
    const step = walks.steps.get(`${tileKey(from)}>${tileKey(to)}`);
    if (step) {
      const along = (x - (step.from.x + 0.5)) * (step.to.x - step.from.x) + (z - (step.from.y + 0.5)) * (step.to.y - step.from.y);
      return step.rise[0] + (step.rise[1] - step.rise[0]) * Math.min(1, Math.max(0, along));
    }
    if (tileKey(from) === tileKey(to) && walks.heights.has(tileKey(from))) return walks.heights.get(tileKey(from))!;
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
