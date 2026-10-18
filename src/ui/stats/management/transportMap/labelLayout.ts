import type { MapSelection } from './selection.ts';
import type { MapNode } from './transportMapModel.ts';
import type { ViewBox } from './useMapViewport.ts';

export const LABEL_TEXT_SIZE = 14;
const CHARACTER_WIDTH = 0.56;
const MARGIN = 3;

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const overlaps = (a: Box, b: Box): boolean => a.left < b.right + MARGIN && a.right + MARGIN > b.left && a.top < b.bottom + MARGIN && a.bottom + MARGIN > b.top;

// The labels that fit without covering one another, placed in order of importance: the selected stop, the Transit hubs, then the others.
export function visibleLabelIds(nodes: readonly MapNode[], selection: MapSelection, view: ViewBox, size: { width: number; height: number }): Set<number> {
  const scale = Math.min(size.width / view.width, size.height / view.height);
  const priority = (node: MapNode) => (selection?.kind === 'stop' && selection.id === node.id ? 0 : node.hub ? 1 : 2);
  const ordered = [...nodes].sort((a, b) => priority(a) - priority(b) || a.id - b.id);
  const placed: Box[] = [];
  const shown = new Set<number>();
  for (const node of ordered) {
    const x = (node.x - view.x) * scale;
    const y = (node.y - view.y) * scale;
    const halfWidth = (node.label.length * LABEL_TEXT_SIZE * CHARACTER_WIDTH) / 2;
    const box = { left: x - halfWidth, right: x + halfWidth, top: y + 8, bottom: y + 8 + LABEL_TEXT_SIZE };
    if (priority(node) > 0 && placed.some(other => overlaps(box, other))) continue;
    placed.push(box);
    shown.add(node.id);
  }
  return shown;
}
