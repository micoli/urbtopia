import type { RampId } from '../core';

export const RAMPS: Record<RampId, readonly string[]> = {
  value: ['#d0ebff', '#74c0fc', '#4263eb', '#5f3dc4'],
  heat: ['#35d07f', '#ffe066', '#ff9f43', '#e5484d', '#7a1f3d'],
  odor: ['#35d07f', '#e8e2a0', '#b9a93f', '#8a5a2b', '#4b2a1a'],
  road: ['#ffc078', '#ff8a3d', '#e5484d'],
  sidewalk: ['#74c0fc', '#4c6ef5', '#9c36b8'],
  saturation: ['#35d07f', '#ffe066', '#e5484d', '#7a1f3d'],
  coverage: ['#e5484d', '#2ec4d6', '#35d07f'],
  wellbeing: ['#e5484d', '#ffe066', '#35d07f'],
};


function channels(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// `share` is clamped to 0..1; returns a 0xRRGGBB number.
export function rampColor(ramp: RampId, share: number): number {
  const stops = RAMPS[ramp];
  const position = Math.min(1, Math.max(0, share)) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(position));
  const from = channels(stops[index]!), to = channels(stops[index + 1]!);
  const mix = position - index;
  const [r, g, b] = from.map((channel, i) => Math.round(channel + (to[i]! - channel) * mix));
  return (r! << 16) | (g! << 8) | b!;
}

// Beacons over the Homes trips leave from and over the buildings they go to.
export const FLOW_COLORS = { origins: '#69db7c', destinations: '#f06595', selected: '#ffd43b' } as const;

// The route of each mode of transport in the flows of a building.
export const MODE_COLORS = { car: '#ff922b', walk: '#4dabf7', cycle: '#20c997' } as const;
