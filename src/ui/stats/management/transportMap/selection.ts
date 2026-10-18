import type { MapLine, MapNode } from './transportMapModel.ts';

export type MapSelection = { kind: 'line'; id: number } | { kind: 'stop'; id: number } | null;

export function isLineDimmed(selection: MapSelection, line: MapLine): boolean {
  if (selection === null) return false;
  return selection.kind === 'line' ? selection.id !== line.id : !line.stops.includes(selection.id);
}

export function isNodeDimmed(selection: MapSelection, node: MapNode, lines: readonly MapLine[]): boolean {
  if (selection === null) return false;
  if (selection.kind === 'stop') return selection.id !== node.id;
  return !lines.some(line => line.id === selection.id && line.stops.includes(node.id));
}
