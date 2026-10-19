import type { Building, BuildingType } from '../engine/state';

export const ENERGY_SOURCES = ['wind', 'solar', 'hydro', 'geothermal', 'coal'] as const;

export type EnergySourceId = (typeof ENERGY_SOURCES)[number];

// The plant that generates each source; solar comes from Solar fields and from panels on a Home instead.
export const PLANT_TYPES = {
  wind: 'powerPlant', hydro: 'hydroPlant', geothermal: 'geothermalPlant', coal: 'coalPlant',
} as const satisfies Record<Exclude<EnergySourceId, 'solar'>, BuildingType>;

const SOURCE_OF_PLANT = { powerPlant: 'wind', hydroPlant: 'hydro', geothermalPlant: 'geothermal' } as const;

export type GeneratingPlantType = keyof typeof SOURCE_OF_PLANT;

export const isGeneratingPlant = (type: string): type is GeneratingPlantType => Object.hasOwn(SOURCE_OF_PLANT, type);

// The source a building feeds into the grid, null for a building that generates nothing by itself. The Coal plant is not one: it only covers what the others leave short.
export function generatedSourceOf(building: Building): Exclude<EnergySourceId, 'coal'> | null {
  if (building.type === 'solar' || building.solar === true) return 'solar';
  return isGeneratingPlant(building.type) ? SOURCE_OF_PLANT[building.type] : null;
}
