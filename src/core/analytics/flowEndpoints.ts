import { footprintOf } from '../buildings/buildingSpecs';
import { congestionStats } from '../traffic/congestion';
import type { Building, BuildingType, GameState } from '../engine/state';
import type { AnalyticsLayerId } from './layers';

export const FLOW_ENDPOINTS = { count: 5 };

export interface FlowEndpoint {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  width: number;
  depth: number;
  volume: number;
}

export interface FlowEndpoints {
  origins: FlowEndpoint[];
  destinations: FlowEndpoint[];
}

function topOf(state: GameState, volumes: ReadonlyMap<number, number>): FlowEndpoint[] {
  const byId = new Map<number, Building>(state.buildings.map(building => [building.id, building]));
  return [...volumes]
    .filter(([id, volume]) => volume > 0 && byId.has(id))
    .sort(([idA, a], [idB, b]) => b - a || idA - idB)
    .slice(0, FLOW_ENDPOINTS.count)
    .map(([id, volume]) => {
      const building = byId.get(id)!;
      const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
      return { id, type: building.type, x: building.x, y: building.y, width, depth, volume: Math.round(volume) };
    });
}

function summed(...maps: ReadonlyMap<number, number>[]): Map<number, number> {
  const total = new Map<number, number>();
  for (const map of maps) for (const [id, volume] of map) total.set(id, (total.get(id) ?? 0) + volume);
  return total;
}

// The Homes the trips of a Movement layer leave from, and the buildings they go to, the busiest first.
export function flowEndpointsOf(state: GameState, layer: AnalyticsLayerId): FlowEndpoints | null {
  if (!layer.startsWith('movement.')) return null;
  const stats = congestionStats(state);
  // A Home with no way to its workplaces wants to commute but no trip takes place.
  const cars = new Map([...stats.homes].map(([id, home]) => [id, home.disconnected ? 0 : home.commuters]));
  const walks = stats.walkTripsByHome;
  const origins = layer === 'movement.cars' ? cars : layer === 'movement.pedestrians' ? walks : summed(cars, walks);
  const destinations = layer === 'movement.cars' ? stats.carArrivals : layer === 'movement.pedestrians' ? stats.walkArrivals : summed(stats.carArrivals, stats.walkArrivals);
  return { origins: topOf(state, origins), destinations: topOf(state, destinations) };
}
