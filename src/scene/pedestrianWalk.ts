import type { PedestrianGraph } from '../core';

const SIDEWALK_INSET = 0.06;
const CROSSING_PREFERENCE = 0.3;

export interface Pedestrian {
  id: number;
  from: string;
  to: string;
  previous: string | null;
  progress: number;
  speed: number;
}

export interface PedestrianPose {
  x: number;
  z: number;
  yaw: number;
}

const positions = new Map<string, { x: number; z: number }>();

export function nodePosition(node: string): { x: number; z: number } {
  const cached = positions.get(node);
  if (cached) return cached;
  const position = parseNodePosition(node);
  positions.set(node, position);
  return position;
}

function parseNodePosition(node: string): { x: number; z: number } {
  const [tile = '0,0', side = 'R'] = node.split(':');
  const [x = 0, y = 0] = tile.split(',').map(Number);
  if (side === 'N') return { x: x + 0.5, z: y + SIDEWALK_INSET };
  if (side === 'S') return { x: x + 0.5, z: y + 1 - SIDEWALK_INSET };
  if (side === 'W') return { x: x + SIDEWALK_INSET, z: y + 0.5 };
  if (side === 'E') return { x: x + 1 - SIDEWALK_INSET, z: y + 0.5 };
  return { x: x + 0.5, z: y + 0.5 };
}

export function startPedestrian(graph: PedestrianGraph, node: string, id: number, speed: number, random: () => number): Pedestrian | null {
  const to = chooseNext(graph, node, null, random);
  if (to === null) return null;
  return { id, from: node, to, previous: null, progress: random(), speed };
}

export function advancePedestrian(graph: PedestrianGraph, pedestrian: Pedestrian, deltaSeconds: number, random: () => number): boolean {
  pedestrian.progress += (pedestrian.speed * deltaSeconds) / edgeLength(pedestrian.from, pedestrian.to);
  while (pedestrian.progress >= 1) {
    const next = chooseNext(graph, pedestrian.to, pedestrian.from, random);
    if (next === null) return false;
    pedestrian.previous = pedestrian.from;
    pedestrian.from = pedestrian.to;
    pedestrian.to = next;
    pedestrian.progress -= 1;
  }
  return true;
}

export function pedestrianPose(pedestrian: Pedestrian): PedestrianPose {
  const from = nodePosition(pedestrian.from);
  const to = nodePosition(pedestrian.to);
  return {
    x: from.x + (to.x - from.x) * pedestrian.progress,
    z: from.z + (to.z - from.z) * pedestrian.progress,
    yaw: Math.atan2(to.x - from.x, to.z - from.z),
  };
}

export function crossedTile(graph: PedestrianGraph, pedestrian: Pedestrian): string | null {
  return graph.get(pedestrian.from)?.find((edge) => edge.to === pedestrian.to)?.crossing ?? null;
}

export function isOnGraph(graph: PedestrianGraph, pedestrian: Pedestrian): boolean {
  return graph.get(pedestrian.from)?.some((edge) => edge.to === pedestrian.to) ?? false;
}

export function targetPedestrianCount({ people, nodes, touch, max = MAX_PEDESTRIANS }: { people: number; nodes: number; touch: boolean; max?: number }): number {
  const ceiling = touch ? max / 2 : max;
  return Math.min(Math.floor(people / PEOPLE_PER_FIGURE), Math.floor(nodes / NODES_PER_FIGURE), ceiling);
}

export const MAX_PEDESTRIANS = 100;
export const MAX_CYCLISTS = 50;
const PEOPLE_PER_FIGURE = 8;
const NODES_PER_FIGURE = 3;

function chooseNext(graph: PedestrianGraph, node: string, previous: string | null, random: () => number): string | null {
  const edges = graph.get(node) ?? [];
  if (edges.length === 0) return null;
  const forward = edges.filter((edge) => edge.to !== previous);
  const options = forward.length > 0 ? forward : edges;
  const crossings = options.filter((edge) => edge.crossing !== null);
  const flat = options.filter((edge) => edge.crossing === null);
  const pool = crossings.length > 0 && (flat.length === 0 || random() < CROSSING_PREFERENCE) ? crossings : flat;
  return pool[Math.floor(random() * pool.length) % pool.length]?.to ?? null;
}

// A Bridge over infrastructure links the sidewalks of its two ramps by one long edge: a walker crosses it at the usual pace.
function edgeLength(from: string, to: string): number {
  const start = nodePosition(from);
  const end = nodePosition(to);
  return Math.max(1, Math.hypot(end.x - start.x, end.z - start.z));
}

export function tileOfNode(node: string): { x: number; y: number } {
  const [x = 0, y = 0] = (node.split(':')[0] ?? '0,0').split(',').map(Number);
  return { x, y };
}
