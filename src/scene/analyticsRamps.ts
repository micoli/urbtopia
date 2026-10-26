import type { AnalyticsLayerId } from '../core';

export type RampId = 'heat' | 'odor';

export const RAMPS: Record<RampId, readonly string[]> = {
  heat: ['#ffe066', '#ff9f43', '#e5484d', '#7a1f3d'],
  odor: ['#e8e2a0', '#b9a93f', '#8a5a2b', '#4b2a1a'],
};

export const LAYER_RAMPS: Partial<Record<AnalyticsLayerId, RampId>> = { 'data.pollution': 'heat', 'data.odor': 'odor' };

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
