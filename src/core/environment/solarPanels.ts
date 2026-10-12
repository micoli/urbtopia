import { definitionOf, isHomeType } from '../buildings/buildingDefinitions';
import { footprintTiles } from '../buildings/buildingSpecs';
import type { SolarPanelsDefinition } from '../buildings/solarPanelsSchema';
import type { Building, BuildingType } from '../engine/state';
import { ECOLOGY } from './ecology';

export const solarPanelsOf = (type: BuildingType): SolarPanelsDefinition | undefined => definitionOf(type)?.solarPanels;

export const canHaveSolarPanels = (type: BuildingType): boolean => solarPanelsOf(type) !== undefined;

export const solarPanelsCost = (building: Building): number => (solarPanelsOf(building.type)?.cost ?? ECOLOGY.solarCost) * building.tier;

export const solarPanelsUnlockCitizens = (type: BuildingType): number => solarPanelsOf(type)?.unlockCitizens ?? ECOLOGY.solarUnlockCitizens;

// A Home keeps its Tier-based output; any other building produces per tile of its footprint.
export function solarPanelsCapacity(building: Building): number {
  const perTile = solarPanelsOf(building.type)?.output;
  if (perTile === undefined && isHomeType(building.type)) return 2 * building.tier;
  return (perTile ?? 1) * footprintTiles(building).length;
}
