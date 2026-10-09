import { entriesOf } from '../defs/entries.ts';
import type { FlatBuilding, FlatTier } from './buildingDefinition.ts';
import type { BuildingId, NatureType, SportVenueType } from './buildingTypes.generated.ts';
import { resolveTiers, resolveVariant } from './tiers.ts';

type Tier = FlatTier;

// A building that grows shows the model and takes the footprint of its Tier 1.
export type BuildingEntry = FlatBuilding & { id: BuildingId; model: string };

// Checked against the schema by the definitions plugin at dev start and build, and by the tests.
const files = import.meta.glob<FlatBuilding>('../../../assets/defs/buildings/*.json', { eager: true, import: 'default' });

const withTierOne = (definition: FlatBuilding & { id: BuildingId }): BuildingEntry => {
  const [first] = resolveTiers<Tier>(definition.tiers ?? []);
  return { ...definition, model: definition.model ?? first?.model ?? '', footprint: definition.footprint ?? first?.footprint };
};

export const BUILDING_ENTRIES: readonly BuildingEntry[] = entriesOf<FlatBuilding, BuildingId>(files).map(withTierOne);

export const BUILDING_IDS: readonly BuildingId[] = BUILDING_ENTRIES.map(({ id }) => id);

const entriesById = new Map<string, BuildingEntry>(BUILDING_ENTRIES.map(entry => [entry.id, entry]));

export const definitionOf = (id: BuildingId): BuildingEntry => entriesById.get(id)!;

export const isRetired = (id: BuildingId): boolean => entriesById.get(id)?.retired === true;

const resolvedTiers = new Map<string, Tier[]>(BUILDING_ENTRIES.map(({ id, tiers }) => [id, resolveTiers<Tier>(tiers ?? [])]));

// Every Tier with what it inherits, empty for a building without Tiers; a variant overrides the look of its first Tiers.
export const tiersOf = (id: BuildingId): readonly Tier[] => resolvedTiers.get(id) ?? [];

export const variantTiersOf = (id: BuildingId, variant: string): Tier[] => {
  const tiers = definitionOf(id).variants?.[variant]?.tiers;
  return tiers ? resolveVariant([...tiersOf(id)], tiers).slice(0, tiers.length) : [];
};

export type SportEntry = BuildingEntry & { id: SportVenueType; kind: 'sport'; radius: number; wellbeingBonus: number };
export type NatureEntry = BuildingEntry & { id: NatureType; kind: 'nature'; family: NonNullable<FlatBuilding['family']> };

export const SPORT_ENTRIES = BUILDING_ENTRIES.filter((entry): entry is SportEntry => entry.kind === 'sport');
export const NATURE_ENTRIES = BUILDING_ENTRIES.filter((entry): entry is NatureEntry => entry.kind === 'nature');
