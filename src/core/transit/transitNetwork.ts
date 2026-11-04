import { definitionOf } from '../buildings/buildingDefinitions';
import { footprintTiles } from '../buildings/buildingSpecs';
import { DIRECTIONS, neighbour, tileKey, type Direction } from '../map/geometry';
import { isInsideOwnedParcels, roadExits, roundaboutTiles } from '../map/occupancy';
import { roadPath } from '../map/roads';
import type { Coord } from '../map/coord';
import type { Bridge, GameState, NetworkMode, TransitTile } from '../engine/state';
import type { FleetVehicleId } from './transitVehicleTypes.generated';
import { FLEET_VEHICLES, type FleetVehicleEntry } from './vehicles';
import { emptyRoadGraph, type RoadGraph } from '../map/roadGraph';
import { bridgeRamps } from '../water/bridgeGeometry';
import { bridgeClearanceFailure } from '../water/bridges';

const networkOf = (station: 'brtStation' | 'railStation' | 'metroStation') => {
  const { unlockCitizens, network } = definitionOf(station);
  return { unlock: unlockCitizens!, ...network! };
};

const fleetSpecOf = ({ mode, propulsion, price, power, coal, cost, emissions }: FleetVehicleEntry) => ({ mode, propulsion, price, power, coal, cost, emissions });

// The BRT and rail networks come from their stations, each vehicle of the fleet from its file.
export const TRANSIT = {
  brt: networkOf('brtStation'),
  rail: networkOf('railStation'),
  metro: networkOf('metroStation'),
  ...(Object.fromEntries(FLEET_VEHICLES.map(vehicle => [vehicle.id, fleetSpecOf(vehicle)])) as Record<FleetVehicleId, ReturnType<typeof fleetSpecOf>>),
};

export const opposite = (d: Direction): Direction => ({ N: 'S', S: 'N', E: 'W', W: 'E' } as const)[d];
export const NETWORK_KEY = { brt: 'brtRoads', rail: 'rails', metro: 'tunnels' } as const satisfies Record<NetworkMode, keyof GameState>;
export const networkTiles = (state: GameState, mode: NetworkMode): TransitTile[] => state[NETWORK_KEY[mode]] ?? [];

const tileMaps = new WeakMap<TransitTile[], Map<string, TransitTile>>();

export function buildNetworkGraph(state: GameState, mode: NetworkMode): RoadGraph {
  const tiles = networkTiles(state, mode);
  const graph = emptyRoadGraph() as RoadGraph & Map<string, readonly Coord[]>;
  for (const tile of tiles) graph.set(tileKey(tile), networkNeighbours(tiles, tile));
  if (mode === 'brt') for (const bridge of state.bridges ?? []) joinRamps(graph, bridge);
  return graph;
}

function joinRamps(graph: Map<string, readonly Coord[]>, bridge: Bridge): void {
  if (bridge.carrier !== 'brt') return;
  const [first, last] = bridgeRamps(bridge);
  if (!first || !last) return;
  graph.set(tileKey(first), [...(graph.get(tileKey(first)) ?? []), last]);
  graph.set(tileKey(last), [...(graph.get(tileKey(last)) ?? []), first]);
}

export function networkNeighbours(tiles: TransitTile[], tile: Coord): Coord[] {
  let map = tileMaps.get(tiles);
  if (!map) { map = new Map(tiles.map(p => [tileKey(p), p])); tileMaps.set(tiles, map); }
  const current = map.get(tileKey(tile));
  if (!current) return [];
  return current.exits.flatMap(d => {
    const next = neighbour(tile, d);
    return map.get(tileKey(next))?.exits.includes(opposite(d)) ? [next] : [];
  });
}

function axis(exits: Direction[]): 'x' | 'y' | null {
  if (exits.length !== 2) return null;
  if (exits.includes('E') && exits.includes('W')) return 'x';
  if (exits.includes('N') && exits.includes('S')) return 'y';
  return null;
}

export function validNetworkCrossings(state: GameState): boolean {
  const brt = state.brtRoads ?? [], rails = state.rails ?? [];
  for (const tiles of [brt, rails]) for (const tile of tiles) {
    const other = (tiles === brt ? rails : brt).find(p => tileKey(p) === tileKey(tile));
    const road = state.roads.find(p => tileKey(p) === tileKey(tile));
    if (other && road) return false;
    const ownAxis = axis(tile.exits);
    if (other && (!ownAxis || !axis(other.exits) || ownAxis === axis(other.exits))) return false;
    if (road && (!ownAxis || !axis(roadExits(state, road)) || ownAxis === axis(roadExits(state, road)))) return false;
  }
  return true;
}

function linkFacingDeadEnds(state: GameState, mode: NetworkMode, map: Map<string, TransitTile>): number {
  const key = NETWORK_KEY[mode];
  let linked = 0;
  const ramps = new Set((state.bridges ?? []).flatMap(bridgeRamps).map(tileKey));
  for (const a of [...map.values()]) for (const d of ['E', 'S'] as const) {
    const b = map.get(tileKey(neighbour(a, d)));
    if (!b || ramps.has(tileKey(a)) || ramps.has(tileKey(b)) || a.exits.length > 1 || b.exits.length > 1 || a.exits.includes(d) || b.exits.includes(opposite(d))) continue;
    a.exits.push(d); b.exits.push(opposite(d));
    if (validNetworkCrossings({ ...state, [key]: [...map.values()] })) { linked++; continue; }
    a.exits.pop(); b.exits.pop();
  }
  return linked;
}

const cloneTiles = (state: GameState, mode: NetworkMode) => new Map(networkTiles(state, mode).map(p => [tileKey(p), { ...p, exits: [...p.exits] }]));

export function brokenLinkCount(state: GameState, mode: NetworkMode): number {
  return linkFacingDeadEnds(state, mode, cloneTiles(state, mode));
}

export function repairNetwork(state: GameState, mode: NetworkMode): TransitTile[] | null {
  const map = cloneTiles(state, mode);
  return linkFacingDeadEnds(state, mode, map) > 0 ? [...map.values()] : null;
}

// A Tunnel runs under anything on the Surface: it only has to stay on owned land, and joins the Tunnels it faces.
function extendTunnels(state: GameState, from: Coord, to: Coord, horizontalFirst: boolean): { tiles: TransitTile[]; cost: number } | { key: 'error.outsideOwnedParcels' } {
  const path = roadPath(from, to, horizontalFirst);
  if (![from, to, ...path].every(p => Number.isSafeInteger(p.x) && Number.isSafeInteger(p.y) && p.x >= 0 && p.y >= 0 && isInsideOwnedParcels(state, p))) return { key: 'error.outsideOwnedParcels' };
  const existing = networkTiles(state, 'metro');
  const map = new Map(existing.map(p => [tileKey(p), { ...p, exits: [...p.exits] }]));
  for (const p of path) if (!map.has(tileKey(p))) map.set(tileKey(p), { ...p, exits: [] });
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!, b = path[i]!;
    const d = DIRECTIONS.find(d => tileKey(neighbour(a, d)) === tileKey(b))!;
    const start = map.get(tileKey(a))!, end = map.get(tileKey(b))!;
    if (!start.exits.includes(d)) start.exits.push(d);
    if (!end.exits.includes(opposite(d))) end.exits.push(opposite(d));
  }
  linkFacingDeadEnds(state, 'metro', map);
  const tiles = [...map.values()];
  return { tiles, cost: (tiles.length - existing.length) * TRANSIT.metro.tileCost };
}

export function extendNetwork(state: GameState, mode: NetworkMode, from: Coord, to: Coord, horizontalFirst: boolean): { tiles: TransitTile[]; cost: number } | { key: 'error.outsideOwnedParcels' | 'error.tilesOccupied' | 'error.invalidCrossing' | 'error.bridgeCrossesAlong' } {
  if (mode === 'metro') return extendTunnels(state, from, to, horizontalFirst);
  if (![from.x, from.y, to.x, to.y].every(n => Number.isSafeInteger(n) && n >= 0) || !isInsideOwnedParcels(state, from) || !isInsideOwnedParcels(state, to)) return { key: 'error.outsideOwnedParcels' };
  const path = roadPath(from, to, horizontalFirst);
  if (!path.every(p => Number.isSafeInteger(p.x) && Number.isSafeInteger(p.y) && isInsideOwnedParcels(state, p))) return { key: 'error.outsideOwnedParcels' };
  const occupied = new Set(state.buildings.flatMap(footprintTiles).map(tileKey));
  for (const center of state.roundabouts) for (const p of roundaboutTiles(center)) occupied.add(tileKey(p));
  if (path.some(p => occupied.has(tileKey(p)))) return { key: 'error.tilesOccupied' };
  const existing = networkTiles(state, mode);
  const map = new Map(existing.map(p => [tileKey(p), { ...p, exits: [...p.exits] }]));
  for (const p of path) if (!map.has(tileKey(p))) map.set(tileKey(p), { ...p, exits: [] });
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!, b = path[i]!;
    const d = DIRECTIONS.find(d => tileKey(neighbour(a, d)) === tileKey(b))!;
    const start = map.get(tileKey(a))!, end = map.get(tileKey(b))!;
    if (!start.exits.includes(d)) start.exits.push(d);
    if (!end.exits.includes(opposite(d))) end.exits.push(opposite(d));
  }
  linkFacingDeadEnds(state, mode, map);
  const tiles = [...map.values()];
  const proposed = { ...state, [NETWORK_KEY[mode]]: tiles };
  if (!validNetworkCrossings(proposed)) return { key: 'error.invalidCrossing' };
  if (bridgeClearanceFailure(proposed) === 'error.bridgeCrossesAlong') return { key: 'error.bridgeCrossesAlong' };
  return { tiles, cost: (tiles.length - existing.length) * TRANSIT[mode].tileCost };
}
