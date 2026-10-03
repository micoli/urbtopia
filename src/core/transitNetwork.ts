import { footprintTiles } from './buildingSpecs';
import { DIRECTIONS, neighbour, tileKey, type Direction } from './geometry';
import { isInsideOwnedParcels, roadExits, roundaboutTiles } from './occupancy';
import { roadPath } from './roads';
import type { Coord } from './coord';
import type { GameState, TransitTile } from './state';

export const TRANSIT = {
  brt: { unlock: 200, tileCost: 12, speed: 3, capacity: 160 },
  rail: { unlock: 600, tileCost: 24, speed: 5, capacity: 400 },
  brtElectric: { price: 900, power: 3, coal: 0, cost: 4, emissions: 0 },
  trainElectric: { price: 2400, power: 8, coal: 0, cost: 8, emissions: 0 },
  trainCoal: { price: 1600, power: 0, coal: 2, cost: 10, emissions: 8 },
};

export const opposite = (d: Direction): Direction => ({ N: 'S', S: 'N', E: 'W', W: 'E' } as const)[d];
export const networkTiles = (state: GameState, mode: 'brt' | 'rail') => (mode === 'brt' ? state.brtRoads : state.rails) ?? [];

const tileMaps = new WeakMap<TransitTile[], Map<string, TransitTile>>();

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

export function extendNetwork(state: GameState, mode: 'brt' | 'rail', from: Coord, to: Coord, horizontalFirst: boolean): { tiles: TransitTile[]; cost: number } | { key: 'error.outsideOwnedParcels' | 'error.tilesOccupied' | 'error.invalidCrossing' } {
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
  const tiles = [...map.values()];
  if (!validNetworkCrossings({ ...state, [mode === 'brt' ? 'brtRoads' : 'rails']: tiles })) return { key: 'error.invalidCrossing' };
  return { tiles, cost: (tiles.length - existing.length) * TRANSIT[mode].tileCost };
}
