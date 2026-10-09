import type { FlatBuilding } from './buildingDefinition.ts';
import type { BuildingId, NatureType, SportVenueType } from './buildingTypes.generated.ts';

export type BuildingEntry = FlatBuilding & { id: BuildingId };

// Checked against the schema by the definitions plugin at dev start and build, and by the tests.
const files = import.meta.glob<FlatBuilding>('../../../assets/defs/buildings/*.json', { eager: true, import: 'default' });

const idOf = (path: string) => path.slice(path.lastIndexOf('/') + 1, -'.json'.length) as BuildingId;

export const BUILDING_ENTRIES: readonly BuildingEntry[] = Object.entries(files)
  .map(([path, { $schema: _schema, ...definition }]: [string, FlatBuilding & { $schema?: string }]) => ({ id: idOf(path), ...definition }))
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id));

export const BUILDING_IDS: readonly BuildingId[] = BUILDING_ENTRIES.map(({ id }) => id);

const entriesById = new Map<string, BuildingEntry>(BUILDING_ENTRIES.map(entry => [entry.id, entry]));

export const definitionOf = (id: BuildingId): BuildingEntry => entriesById.get(id)!;

export const isRetired = (id: BuildingId): boolean => entriesById.get(id)?.retired === true;

export type SportEntry = BuildingEntry & { id: SportVenueType; kind: 'sport'; radius: number; wellbeingBonus: number };
export type NatureEntry = BuildingEntry & { id: NatureType; kind: 'nature'; family: NonNullable<FlatBuilding['family']> };

export const SPORT_ENTRIES = BUILDING_ENTRIES.filter((entry): entry is SportEntry => entry.kind === 'sport');
export const NATURE_ENTRIES = BUILDING_ENTRIES.filter((entry): entry is NatureEntry => entry.kind === 'nature');
