import type { MapLine, MapNode, MapTransfer } from './transportMapModel.ts';

// Gaps kept between two separate sub-networks, in tiles: wide enough for the labels, small enough to see the whole map at once.
export const COMPONENT_GAP = { x: 10, y: 6 } as const;

type Axis = 'x' | 'y';

interface Component {
  ids: number[];
  min: Record<Axis, number>;
  max: Record<Axis, number>;
}

function componentsOf(nodes: readonly MapNode[], lines: readonly MapLine[], transfers: readonly MapTransfer[]): number[][] {
  const parent = new Map(nodes.map(node => [node.id, node.id]));
  const find = (id: number): number => {
    const up = parent.get(id) ?? id;
    if (up === id) return id;
    const root = find(up);
    parent.set(id, root);
    return root;
  };
  const join = (a: number, b: number) => {
    if (parent.has(a) && parent.has(b)) parent.set(find(a), find(b));
  };
  for (const line of lines) for (let i = 1; i < line.stops.length; i++) join(line.stops[i - 1]!, line.stops[i]!);
  for (const transfer of transfers) join(transfer.from, transfer.to);
  const groups = new Map<number, number[]>();
  for (const node of nodes) groups.set(find(node.id), [...(groups.get(find(node.id)) ?? []), node.id]);
  return [...groups.values()];
}

function boundsOf(ids: readonly number[], nodes: ReadonlyMap<number, MapNode>): Component {
  const members = ids.map(id => nodes.get(id)!);
  return {
    ids: [...ids],
    min: { x: Math.min(...members.map(n => n.x)), y: Math.min(...members.map(n => n.y)) },
    max: { x: Math.max(...members.map(n => n.x)), y: Math.max(...members.map(n => n.y)) },
  };
}

// Slides each component towards the origin of the axis until it meets one that shares its band on the other axis.
function compactAxis(components: Component[], axis: Axis, gap: number): Map<Component, number> {
  const other: Axis = axis === 'x' ? 'y' : 'x';
  const origin = Math.min(...components.map(component => component.min[axis]));
  const shifts = new Map<Component, number>();
  const placed: { min: number; max: number; band: [number, number] }[] = [];
  for (const component of [...components].sort((a, b) => a.min[axis] - b.min[axis])) {
    const band: [number, number] = [component.min[other], component.max[other]];
    const blockers = placed.filter(p => p.band[0] - gap < band[1] && band[0] - gap < p.band[1]);
    const start = Math.max(origin, ...blockers.map(p => p.max + gap));
    shifts.set(component, start - component.min[axis]);
    placed.push({ min: start, max: start + component.max[axis] - component.min[axis], band });
  }
  return shifts;
}

// Brings the separate sub-networks closer to each other without overlapping them, keeping the shape of each one.
export function compactComponents(nodes: readonly MapNode[], lines: readonly MapLine[], transfers: readonly MapTransfer[]): MapNode[] {
  if (nodes.length === 0) return [];
  let placed = [...nodes];
  for (const axis of ['x', 'y'] as const) {
    const byId = new Map(placed.map(node => [node.id, node]));
    const components = componentsOf(placed, lines, transfers).map(ids => boundsOf(ids, byId));
    if (components.length < 2) break;
    const shifts = compactAxis(components, axis, COMPONENT_GAP[axis]);
    const moved = new Map<number, number>();
    for (const component of components) for (const id of component.ids) moved.set(id, shifts.get(component) ?? 0);
    placed = placed.map(node => ({ ...node, [axis]: node[axis] + (moved.get(node.id) ?? 0) }));
  }
  return placed;
}
