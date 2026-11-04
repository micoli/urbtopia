import { footprintTiles } from '../buildings/buildingSpecs';
import type { Building, GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';

export function metroStations(state: GameState): Building[] {
  return state.buildings.filter((building) => building.type === 'metroStation');
}

// A Metro station serves no line until a Tunnel runs under it.
export function isMetroStationActive(state: GameState, station: Building): boolean {
  const tunnels = new Set((state.tunnels ?? []).map(tileKey));
  return footprintTiles(station).some((tile) => tunnels.has(tileKey(tile)));
}

// The tiles of a Metro station where a walkway under it joins the station: the station is then a stair to Level -1.
export function stationStairTiles(state: GameState): Coord[] {
  const walkways = new Set((state.walkways ?? []).map(tileKey));
  if (walkways.size === 0) return [];
  return metroStations(state).flatMap((station) => footprintTiles(station).filter((tile) => walkways.has(tileKey(tile))));
}
