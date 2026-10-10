import type { BuildingKind, FlatBuilding } from '../buildings/buildingDefinition.ts';
import { resolveTiers } from '../buildings/tiers.ts';
import type { DescriptionValues } from './messageFormat.ts';

// What a description of a Game object can mention: its own numbers, those of its first and last Tier, and values the code works out.

export interface ComputedValue {
  label: string;
  value: (definition: FlatBuilding) => string | number | undefined;
}

type Tier = Record<string, unknown>;

const NOT_VALUES = new Set(['order', 'model', 'footprint', 'upgradeCost', 'posts']);

const tiersOf = (definition: FlatBuilding): Tier[] => resolveTiers<Tier>((definition.tiers ?? []) as Tier[]);

const capitalised = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

const numbersOf = (record: Record<string, unknown>): [string, number][] => Object.entries(record).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && !NOT_VALUES.has(entry[0]));

const reachSide = (definition: FlatBuilding) => (definition.radius === undefined ? undefined : 2 * definition.radius);

const footprintOf = (definition: FlatBuilding) => definition.footprint ?? (tiersOf(definition)[0]?.footprint as [number, number] | undefined);

// Values computed by code, by kind of building.
export const COMPUTED_VALUES: Partial<Record<BuildingKind, Record<string, ComputedValue>>> = {
  facility: {
    side: { label: 'Side of the square reach (tiles)', value: reachSide },
    reach: { label: 'Reach: “square”, or “city” without a radius', value: definition => (definition.radius === undefined ? 'city' : 'square') },
    limit: { label: 'Capacity: “limited”, or “unlimited” without one', value: definition => (tiersOf(definition)[0]?.capacity === undefined ? 'unlimited' : 'limited') },
    tier1Capacity: { label: 'Citizen capacity at Tier 1 (none when unlimited)', value: definition => tiersOf(definition)[0]?.capacity as number | undefined },
    maxTierCapacity: { label: 'Citizen capacity at the highest Tier (none when unlimited)', value: definition => tiersOf(definition).at(-1)?.capacity as number | undefined },
    hasWater: { label: 'Water demand: “yes” or “no”', value: definition => ((definition.water ?? 0) > 0 ? 'yes' : 'no') },
  },
  sport: {
    side: { label: 'Side of the square reach (tiles)', value: reachSide },
    width: { label: 'Width of the footprint (tiles)', value: definition => footprintOf(definition)?.[0] },
    depth: { label: 'Depth of the footprint (tiles)', value: definition => footprintOf(definition)?.[1] },
  },
  casino: {
    side: { label: 'Side of the square reach at Tier 1 (tiles)', value: definition => 2 * (tiersOf(definition)[0]!.radius as number) },
  },
};

export const computedValuesOf = (definition: FlatBuilding): Record<string, ComputedValue> => COMPUTED_VALUES[definition.kind] ?? {};

// The numbers of the definition itself, of its first and last Tier, and the count of Tiers.
export function fieldValuesOf(definition: FlatBuilding): DescriptionValues {
  const tiers = tiersOf(definition);
  const first = tiers[0];
  const last = tiers.at(-1);
  return {
    ...Object.fromEntries(numbersOf(definition as Record<string, unknown>)),
    ...(tiers.length ? { tierCount: tiers.length } : {}),
    ...Object.fromEntries(first ? numbersOf(first).map(([key, value]) => [`tier1${capitalised(key)}`, value]) : []),
    ...Object.fromEntries(last ? numbersOf(last).map(([key, value]) => [`maxTier${capitalised(key)}`, value]) : []),
  };
}

export function descriptionValuesOf(definition: FlatBuilding): DescriptionValues {
  const computed = Object.entries(computedValuesOf(definition)).flatMap(([name, { value }]) => {
    const result = value(definition);
    return result === undefined ? [] : [[name, result] as const];
  });
  return { ...fieldValuesOf(definition), ...Object.fromEntries(computed) };
}

// Every name a template of the definition may use, with what it stands for.
export function describedValuesOf(definition: FlatBuilding): { name: string; label: string; value: string | number | undefined }[] {
  const values = descriptionValuesOf(definition);
  const computed = Object.entries(computedValuesOf(definition)).map(([name, { label, value }]) => ({ name, label, value: value(definition) }));
  const fields = Object.keys(fieldValuesOf(definition)).filter(name => !(name in computedValuesOf(definition))).map(name => ({ name, label: labelOfField(name), value: values[name] }));
  return [...fields, ...computed];
}

const words = (key: string) => key.replace(/([A-Z])/g, ' $1').toLowerCase();

function labelOfField(name: string): string {
  if (name === 'tierCount') return 'Number of Tiers';
  const first = /^tier1(.+)$/.exec(name);
  if (first) return `${words(first[1]!)} at Tier 1`.replace(/^./, letter => letter.toUpperCase());
  const last = /^maxTier(.+)$/.exec(name);
  if (last) return `${words(last[1]!)} at the highest Tier`.replace(/^./, letter => letter.toUpperCase());
  return words(name).replace(/^./, letter => letter.toUpperCase());
}
