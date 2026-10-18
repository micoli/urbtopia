import waste from '../../../assets/defs/balance/waste.json' with { type: 'json' };
import { citizensOf } from '../buildings/city';

export const WASTE = waste;

// Order of use: the cleanest facility first, whatever it costs.
export const WASTE_KINDS = ['recyclingPlant', 'incinerator', 'mound'] as const;

export type WasteKind = (typeof WASTE_KINDS)[number];

export function wasteKindOf(type: string): WasteKind | null {
  return WASTE_KINDS.find(kind => kind === type) ?? null;
}

export function wasteCapacity(kind: WasteKind, tier: number): number {
  const { capacities } = WASTE.facilities[kind];
  return capacities[tier - 1] ?? capacities[capacities.length - 1]!;
}

export function homeWasteProduction(tier: number): number {
  return citizensOf(tier) * WASTE.unitsPerCitizenPerDay;
}
