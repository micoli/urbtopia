import { roadExits, tileKey, type Coord, type CongestionStats, type GameState } from '../core';

const ORANGE = [0xff, 0x9f, 0x1c] as const;
const RED = [0xd6, 0x28, 0x28] as const;
const ROAD_HALF_WIDTH = 0.4;
const TINT_LEVELS = 3;
export const CROSSING_TINT = 0x3a86ff;

export interface DividerStrip {
  x: number;
  z: number;
  horizontal: boolean;
  offset: number;
}

export function tintColor(ratio: number): number {
  const t = Math.min(1, Math.max(0, ratio - 1));
  const [r, g, b] = ORANGE.map((channel, index) => Math.round(channel + (RED[index]! - channel) * t));
  return (r! << 16) | (g! << 8) | b!;
}

export function dividerStrips(state: GameState): DividerStrip[] {
  const strips: DividerStrip[] = [];
  for (const road of state.roads) {
    const tier = road.tier ?? 1;
    if (tier < 2 || road.kind === 'crossing') continue;
    const horizontal = isStraight(state, road, 'E', 'W');
    if (!horizontal && !isStraight(state, road, 'N', 'S')) continue;
    for (let lane = 1; lane < tier; lane++) {
      const offset = (ROAD_HALF_WIDTH / tier) * lane;
      strips.push({ x: road.x + 0.5, z: road.y + 0.5, horizontal, offset });
      strips.push({ x: road.x + 0.5, z: road.y + 0.5, horizontal, offset: -offset });
    }
  }
  return strips;
}

function isStraight(state: GameState, tile: Coord, a: 'N' | 'E', b: 'S' | 'W'): boolean {
  const exits = roadExits(state, tile);
  return exits.length === 2 && exits.includes(a) && exits.includes(b);
}

const tintsByStats = new WeakMap<CongestionStats, ReadonlyMap<string, number>>();

// Road tint per saturated tile, in a few steps so that tiles share materials.
export function congestionTints(stats: CongestionStats): ReadonlyMap<string, number> {
  const cached = tintsByStats.get(stats);
  if (cached) return cached;
  const tints = new Map<string, number>();
  for (const [key, section] of stats.sections) {
    if (section.ratio <= 1) continue;
    const level = Math.min(TINT_LEVELS, Math.ceil((section.ratio - 1) * TINT_LEVELS));
    tints.set(key, tintColor(1 + level / TINT_LEVELS));
  }
  for (const crossing of stats.crossings.values()) {
    if (crossing.saturated) tints.set(tileKey(crossing.tile), CROSSING_TINT);
  }
  tintsByStats.set(stats, tints);
  return tints;
}
