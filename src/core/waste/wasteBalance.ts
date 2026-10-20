import waste from '../../../assets/defs/balance/waste.json' with { type: 'json' };
import { definitionOf, tiersOf } from '../buildings/buildingDefinitions';
import { citizensOf } from '../buildings/city';

export const WASTE = waste;

// Order of use: the cleanest facility first, whatever it costs.
export const WASTE_KINDS = ['recyclingPlant', 'incinerator', 'mound'] as const;

export type WasteKind = (typeof WASTE_KINDS)[number];

export interface WasteFacilitySpec {
  reach: number;
  tariff: number;
  unlockCitizens: number;
  odor: { radius: number; malus: number } | null;
  pollution: { radius: number; malus: number } | null;
  emissionsPerUnit: number;
}

function specOf(kind: WasteKind): WasteFacilitySpec {
  const { radius, unlockCitizens, waste: traits } = definitionOf(kind);
  const { tariff, odorRadius, odorMalus, pollutionRadius, pollutionMalus, emissionsPerUnit } = traits!;
  return {
    reach: radius!,
    tariff,
    unlockCitizens: unlockCitizens!,
    odor: odorRadius && odorMalus ? { radius: odorRadius, malus: odorMalus } : null,
    pollution: pollutionRadius && pollutionMalus ? { radius: pollutionRadius, malus: pollutionMalus } : null,
    emissionsPerUnit: emissionsPerUnit ?? 0,
  };
}

export const WASTE_FACILITIES = Object.fromEntries(WASTE_KINDS.map(kind => [kind, specOf(kind)])) as Record<WasteKind, WasteFacilitySpec>;

// From this many Citizens the city is expected to handle its Waste.
export const WASTE_REQUIRED_FROM_CITIZENS = Math.min(...WASTE_KINDS.map(kind => WASTE_FACILITIES[kind].unlockCitizens));

// Home Tier from which a Home must be covered to grow.
export const WASTE_REQUIRED_TIER = 7;

export function wasteKindOf(type: string): WasteKind | null {
  return WASTE_KINDS.find(kind => kind === type) ?? null;
}

export function wasteCapacity(kind: WasteKind, tier: number): number {
  const tiers = tiersOf(kind);
  return (tiers[tier - 1] ?? tiers[tiers.length - 1])!.capacity!;
}

// `reduction` is the share an Ordinance takes off what Homes produce.
export function homeWasteProduction(tier: number, reduction = 0): number {
  return citizensOf(tier) * WASTE.unitsPerCitizenPerDay * (1 - reduction);
}
