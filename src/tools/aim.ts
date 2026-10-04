import type { Coord } from '../core';

export type PointerKind = 'mouse' | 'touch';

export function aimTile(pointerKind: PointerKind, hoverTile: Coord | null, centerTile: Coord, pinnedTile: Coord | null = null): Coord {
  if (pointerKind === 'mouse' && hoverTile) return hoverTile;
  return pinnedTile ?? centerTile;
}

export function pointerKindOf(pointerType: string): PointerKind {
  return pointerType === 'mouse' ? 'mouse' : 'touch';
}
