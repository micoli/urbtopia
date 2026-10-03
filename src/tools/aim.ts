import type { Coord } from '../core';

export type PointerKind = 'mouse' | 'touch';

export function aimTile(pointerKind: PointerKind, hoverTile: Coord | null, centerTile: Coord): Coord {
  return pointerKind === 'mouse' && hoverTile ? hoverTile : centerTile;
}

export function pointerKindOf(pointerType: string): PointerKind {
  return pointerType === 'mouse' ? 'mouse' : 'touch';
}
