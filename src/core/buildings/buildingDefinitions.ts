import definitions from '../../../assets/buildings.json' with { type: 'json' };
import type { BuildingDefinition } from './buildingDefinition.ts';
import type { BuildingId, NatureType, SportVenueType } from './buildingTypes.generated.ts';

export type BuildingEntry = BuildingDefinition & { id: BuildingId };

export const BUILDING_ENTRIES: readonly BuildingEntry[] = Object.entries(definitions as unknown as Record<BuildingId, BuildingDefinition>)
  .map(([id, definition]) => ({ id: id as BuildingId, ...definition }));

export const BUILDING_IDS: readonly BuildingId[] = BUILDING_ENTRIES.map(({ id }) => id);

const entriesById = new Map<string, BuildingEntry>(BUILDING_ENTRIES.map(entry => [entry.id, entry]));

export const definitionOf = (id: BuildingId): BuildingEntry => entriesById.get(id)!;

export type SportEntry = BuildingEntry & { id: SportVenueType; sport: NonNullable<BuildingDefinition['sport']> };
export type NatureEntry = BuildingEntry & { id: NatureType; nature: NonNullable<BuildingDefinition['nature']> };

export const SPORT_ENTRIES = BUILDING_ENTRIES.filter((entry): entry is SportEntry => entry.sport !== undefined);
export const NATURE_ENTRIES = BUILDING_ENTRIES.filter((entry): entry is NatureEntry => entry.nature !== undefined);
