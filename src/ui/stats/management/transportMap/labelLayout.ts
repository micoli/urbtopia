import type { MapSelection } from './selection.ts';
import type { MapNode } from './transportMapModel.ts';
import type { ViewBox } from './useMapViewport.ts';

export const LABEL_TEXT_SIZE = 14;
const CHARACTER_WIDTH = 0.56;
const MARGIN = 3;
export const COORDINATES_SCALE = 0.85;
export const LINE_HEIGHT = 1.15;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const overlaps = (a: Box, b: Box): boolean => a.left < b.right + MARGIN && a.right + MARGIN > b.left && a.top < b.bottom + MARGIN && a.bottom + MARGIN > b.top;

export type LabelAnchor = 'start' | 'middle' | 'end';

// The labels that fit without covering one another, placed in order of importance: the selected stop, the Transit hubs, then the others.
// A label that would run past an edge of the map leans on its stop instead of being centred on it.
export function visibleLabels(nodes: readonly MapNode[], selection: MapSelection, view: ViewBox, size: { width: number; height: number }, showCoordinates = true): Map<number, LabelAnchor> {
  const scale = Math.min(size.width / view.width, size.height / view.height);
  const priority = (node: MapNode) => (selection?.kind === 'stop' && selection.id === node.id ? 0 : node.hub ? 1 : 2);
  const ordered = [...nodes].sort((a, b) => priority(a) - priority(b) || a.id - b.id);
  const placed: Box[] = [];
  const shown = new Map<number, LabelAnchor>();
  for (const node of ordered) {
    const x = (node.x - view.x) * scale + size.width / 2 - (view.width * scale) / 2;
    const y = (node.y - view.y) * scale;
    const width = (showCoordinates ? Math.max(node.name.length, node.coordinates.length * COORDINATES_SCALE) : node.name.length) * LABEL_TEXT_SIZE * CHARACTER_WIDTH;
    const anchor: LabelAnchor = x + width / 2 > size.width ? 'end' : x - width / 2 < 0 ? 'start' : 'middle';
    const left = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x + 6 - width : x - 6;
    const box = { left, right: left + width, top: y + 8, bottom: y + 8 + LABEL_TEXT_SIZE * LINE_HEIGHT * (showCoordinates ? 1 + COORDINATES_SCALE : 1) };
    if (priority(node) > 0 && placed.some(other => overlaps(box, other))) continue;
    placed.push(box);
    shown.set(node.id, anchor);
  }
  return shown;
}
