import { footprintOf } from '../buildings/buildingSpecs';
import { isHomeType } from '../buildings/buildingDefinitions';
import { congestionStats, workplaceTypes, type TripMode } from '../traffic/congestion';
import { walkDestinationOf } from '../traffic/walking';
import type { Building, BuildingType, GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';
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
  if (!layer.startsWith('movement.') || layer === 'movement.flows') return null;
  const stats = congestionStats(state);
  // A Home with no way to its workplaces wants to commute but no trip takes place.
  const cars = new Map([...stats.homes].map(([id, home]) => [id, home.disconnected ? 0 : home.commuters]));
  const walks = stats.walkTripsByHome;
  const origins = layer === 'movement.cars' ? cars : layer === 'movement.pedestrians' ? walks : summed(cars, walks);
  const destinations = layer === 'movement.cars' ? stats.carArrivals : layer === 'movement.pedestrians' ? stats.walkArrivals : summed(stats.carArrivals, stats.walkArrivals);
  return { origins: topOf(state, origins), destinations: topOf(state, destinations) };
}

// A Home, a workplace or somewhere to walk to: the buildings Citizens travel to or from.
export const hasTrips = (building: Building): boolean => isHomeType(building.type) || workplaceTypes.includes(building.type) || walkDestinationOf(building) !== null;

export type ModeVolumes = Record<TripMode, number>;

// A building on the other end of the trips of the selected one.
export interface BuildingFlow extends FlowEndpoint {
  modes: ModeVolumes;
}

export interface BuildingFlows {
  building: FlowEndpoint;
  // Where the Citizens working or shopping in the building come from.
  arrivals: BuildingFlow[];
  // Where the Citizens living in the building go to.
  departures: BuildingFlow[];
  // The tiles the trips of each mode go along, each listed once.
  routes: Record<TripMode, Coord[]>;
}

const noModes = (): ModeVolumes => ({ car: 0, walk: 0, cycle: 0 });

function endpointOf(building: Building, volume: number): FlowEndpoint {
  const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
  return { id: building.id, type: building.type, x: building.x, y: building.y, width, depth, volume };
}

// The trips from a Home to its workplaces and services, or from its Homes to a workplace or service, busiest first.
export function buildingFlowsOf(state: GameState, buildingId: number): BuildingFlows | null {
  const byId = new Map<number, Building>(state.buildings.map(building => [building.id, building]));
  const selected = byId.get(buildingId);
  if (!selected) return null;
  const routeTiles: Record<TripMode, Map<string, Coord>> = { car: new Map(), walk: new Map(), cycle: new Map() };
  const sides = { arrivals: new Map<number, ModeVolumes>(), departures: new Map<number, ModeVolumes>() };
  for (const trip of congestionStats(state).trips) {
    const [side, other] = trip.to === buildingId ? [sides.arrivals, trip.from] : trip.from === buildingId ? [sides.departures, trip.to] : [null, 0];
    if (!side) continue;
    const modes = side.get(other) ?? noModes();
    modes[trip.mode] += trip.count;
    side.set(other, modes);
    for (const tile of trip.path) routeTiles[trip.mode].set(tileKey(tile), tile);
  }
  const flowsOf = (side: Map<number, ModeVolumes>): BuildingFlow[] => [...side]
    .filter(([id]) => byId.has(id))
    .map(([id, modes]) => ({ ...endpointOf(byId.get(id)!, Math.round(modes.car + modes.walk + modes.cycle)), modes }))
    .filter(flow => flow.volume > 0)
    .sort((a, b) => b.volume - a.volume || a.id - b.id);
  const arrivals = flowsOf(sides.arrivals);
  const departures = flowsOf(sides.departures);
  const total = (flows: BuildingFlow[]) => flows.reduce((sum, flow) => sum + flow.volume, 0);
  const routes = { car: [...routeTiles.car.values()], walk: [...routeTiles.walk.values()], cycle: [...routeTiles.cycle.values()] };
  return { building: endpointOf(selected, Math.max(total(arrivals), total(departures))), arrivals, departures, routes };
}
