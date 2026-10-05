import { roadExits, type Coord, type GameState } from '../core';

const ORANGE = [0xff, 0x9f, 0x1c] as const;
const RED = [0xd6, 0x28, 0x28] as const;
const ROAD_HALF_WIDTH = 0.4;

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
