import { BUILDING_ENTRIES } from '../core/buildings/buildingDefinitions';
import type { BuildingId } from '../core/buildings/buildingTypes.generated';
import { isFacilityType } from '../core/services/facilities';

type BuildingMessageKey = `building.${BuildingId}` | `codex.description.${BuildingId}`;

// Descriptions of buildings with a stats sentence (public facilities, sport venues) are completed by their own message module.
export function buildingMessages(language: 'en' | 'fr'): Record<BuildingMessageKey, string> {
  return Object.fromEntries(BUILDING_ENTRIES.flatMap(({ id, kind, name, description }) => [
    [`building.${id}`, name[language]],
    ...(description && kind !== 'sport' && !isFacilityType(id) ? [[`codex.description.${id}`, description[language]]] : []),
  ])) as Record<BuildingMessageKey, string>;
}
