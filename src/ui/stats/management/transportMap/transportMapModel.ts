import { buildingDistance, footprintOf, type Building, type GameState, type TransitMode, type transportStats } from '../../../../core';
import { t } from '../../../../i18n/t.ts';
import { compactComponents } from './compactComponents.ts';
import { layerBounds, pedestrianJunctions, pedestrianSegments, roadSegments, stopConnections, type MapConnection, type MapJunction, type MapSegment } from './networkLayers.ts';

type Line = ReturnType<typeof transportStats>['lines'][number];

export type LoadLevel = 'free' | 'loaded' | 'saturated';

export const LOAD_LEVELS = { loaded: 0.6, saturated: 0.9 } as const;
export const TRANSFER_DISTANCE = 2;

export interface MapNode {
  id: number;
  x: number;
  y: number;
  realX: number;
  realY: number;
  label: string;
  name: string;
  coordinates: string;
  hub: boolean;
  carriesBikes: boolean;
  modes: TransitMode[];
}

export interface MapLine {
  id: number;
  mode: TransitMode;
  stops: number[];
  loop: boolean;
  active: boolean;
  status: Line['status'];
  load: number;
  level: LoadLevel;
  riders: number;
  cyclists: number;
  capacity: number;
  headway: number;
}

export interface MapTransfer {
  from: number;
  to: number;
}

export interface MapBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface TransportMapModel {
  nodes: MapNode[];
  lines: MapLine[];
  transfers: MapTransfer[];
  bounds: MapBounds;
  // The same stops at their real place, with the road and pedestrian layers that only make sense there.
  realBounds: MapBounds;
  roads: MapSegment[];
  pedestrianWays: MapSegment[];
  connections: MapConnection[];
  junctions: MapJunction[];
  roadBounds: MapBounds | null;
  pedestrianBounds: MapBounds | null;
}

export function loadLevel(load: number): LoadLevel {
  if (load >= LOAD_LEVELS.saturated) return 'saturated';
  if (load >= LOAD_LEVELS.loaded) return 'loaded';
  return 'free';
}

function centerOf(building: Building): { x: number; y: number } {
  const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
  return { x: building.x + width / 2, y: building.y + depth / 2 };
}

function mapLine(line: Line): MapLine {
  const load = line.capacity > 0 ? Math.min(1, (line.riders + line.cyclists) / line.capacity) : 0;
  return {
    id: line.id, mode: line.mode, stops: line.stops, loop: line.loop === true, active: line.active, status: line.status,
    load, level: loadLevel(load), riders: line.riders, cyclists: line.cyclists, capacity: line.capacity, headway: line.headway,
  };
}

export function buildTransportMap(state: GameState, transport: Pick<ReturnType<typeof transportStats>, 'lines'>): TransportMapModel {
  const used = new Set(transport.lines.flatMap(line => line.stops));
  const buildings = new Map(state.buildings.filter(building => used.has(building.id)).map(building => [building.id, building]));
  const lines = transport.lines.map(mapLine);
  const modesOf = (id: number) => [...new Set(lines.filter(line => line.stops.includes(id)).map(line => line.mode))];
  const nodes = [...buildings.values()].map((building): MapNode => {
    const name = building.name ?? `${t(`building.${building.type}`)} #${building.id}`;
    const coordinates = `(${building.x}, ${building.y})`;
    return {
      id: building.id, ...centerOf(building), realX: centerOf(building).x, realY: centerOf(building).y, label: `${name} ${coordinates}`, name, coordinates, hub: building.type === 'transitHub',
      carriesBikes: building.type !== 'busStop', modes: modesOf(building.id),
    };
  });
  const transfers: MapTransfer[] = [];
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = buildings.get(nodes[i]!.id)!, b = buildings.get(nodes[j]!.id)!;
    if (buildingDistance(a, b) <= TRANSFER_DISTANCE) transfers.push({ from: a.id, to: b.id });
  }
  const placed = compactComponents(nodes, lines, transfers);
  const roads = roadSegments(state), pedestrianWays = pedestrianSegments(state);
  return {
    nodes: placed, lines, transfers, bounds: boundsOf(placed),
    realBounds: boundsOf(nodes.map(node => ({ ...node, x: node.realX, y: node.realY }))),
    roads, pedestrianWays, connections: stopConnections(state, [...buildings.values()]), junctions: pedestrianJunctions(state),
    roadBounds: layerBounds(roads), pedestrianBounds: layerBounds(pedestrianWays),
  };
}

function boundsOf(nodes: readonly MapNode[]): MapBounds {
  if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  const xs = nodes.map(node => node.x), ys = nodes.map(node => node.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

export function visibleLines(model: TransportMapModel, modes: ReadonlySet<TransitMode>): MapLine[] {
  return model.lines.filter(line => modes.has(line.mode));
}

export function mergeBounds(base: MapBounds, ...others: (MapBounds | null)[]): MapBounds {
  return others.reduce<MapBounds>((merged, other) => (other === null ? merged : {
    minX: Math.min(merged.minX, other.minX), minY: Math.min(merged.minY, other.minY), maxX: Math.max(merged.maxX, other.maxX), maxY: Math.max(merged.maxY, other.maxY),
  }), base);
}
