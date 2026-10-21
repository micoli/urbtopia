import { isHomeType } from '../buildings/buildingDefinitions';
import type { Building, GameState } from '../engine/state';
import { FACILITIES, facilitiesOfCategory, isFacilityType, SERVICE_CATEGORIES, type FacilityType, type ServiceCategory } from '../services/facilities';
import { serviceCoverage, transitReachLinks } from '../services/services';
import { servingReach, TRANSIT_REACH, TRANSIT_REACH_STOP_TYPES } from './transitReach';

export interface TransitReachCategoryFigures {
  category: ServiceCategory;
  facilities: number;
  homes: number;
  direct: number;
  viaTransit: number;
}

export interface TransitReachFacilityFigures {
  id: number;
  type: FacilityType;
  homes: number;
}

export interface TransitReachCodexFigures {
  maxMinutes: number;
  stopTypes: typeof TRANSIT_REACH_STOP_TYPES;
  excluded: readonly ServiceCategory[];
  lines: number;
  stops: number;
  categories: TransitReachCategoryFigures[];
  facilities: TransitReachFacilityFigures[];
}

const EXCLUDED: readonly ServiceCategory[] = ['waste'];

const isExtended = (building: Building): boolean => isFacilityType(building.type) && !EXCLUDED.includes(FACILITIES[building.type].category) && FACILITIES[building.type].radius !== null;

// Every figure of the Transit reach Codex page, from the same coverage as the simulation.
export function transitReachCodexFigures(state: GameState): TransitReachCodexFigures {
  const coverage = serviceCoverage(state);
  const links = transitReachLinks(state);
  const homes = state.buildings.filter(building => isHomeType(building.type));
  const { lines, stopIds } = servingReach(state);
  const categories = SERVICE_CATEGORIES.filter(category => !EXCLUDED.includes(category)).map((category): TransitReachCategoryFigures => {
    const types = facilitiesOfCategory(category);
    let direct = 0, viaTransit = 0;
    for (const home of homes) {
      const covering = types.filter(type => coverage.get(home.id)?.has(type));
      if (!covering.length) continue;
      if (covering.every(type => links.get(home.id)?.has(type))) viaTransit++;
      else direct++;
    }
    return { category, facilities: state.buildings.filter(building => types.includes(building.type as FacilityType)).length, homes: homes.length, direct, viaTransit };
  }).filter(figures => figures.facilities > 0);
  const reached = new Map<number, number>();
  for (const byType of links.values()) for (const link of byType.values()) reached.set(link.facilityId, (reached.get(link.facilityId) ?? 0) + 1);
  const facilities = state.buildings
    .filter(isExtended)
    .map((building): TransitReachFacilityFigures => ({ id: building.id, type: building.type as FacilityType, homes: reached.get(building.id) ?? 0 }))
    .sort((a, b) => b.homes - a.homes || a.id - b.id);
  return { maxMinutes: TRANSIT_REACH.maxMinutes, stopTypes: TRANSIT_REACH_STOP_TYPES, excluded: EXCLUDED, lines, stops: stopIds.size, categories, facilities };
}
