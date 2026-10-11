import { BUILDING_ENTRIES } from '../core/buildings/buildingDefinitions';
import type { BuildingId } from '../core/buildings/buildingTypes.generated';
import { descriptionValuesOf } from '../core/descriptions/descriptionValues';
import { renderDescription } from '../core/descriptions/messageFormat';

type BuildingMessageKey = `building.${BuildingId}` | `building.solar-${BuildingId}` | `codex.description.${BuildingId}`;

const SOLAR_SUFFIX = { en: 'Solar', fr: 'solaire' };

// Descriptions are ICU templates over the numbers of the building; the codex shows them rendered.
export function buildingMessages(language: 'en' | 'fr'): Record<BuildingMessageKey, string> {
  return Object.fromEntries(BUILDING_ENTRIES.flatMap(entry => [
    [`building.${entry.id}`, entry.name[language]],
    ...(entry.kind === 'home' && entry.id !== 'home' && entry.variants?.solar ? [[`building.solar-${entry.id}`, `${entry.name[language]} · ${SOLAR_SUFFIX[language]}`]] : []),
    ...(entry.description ? [[`codex.description.${entry.id}`, renderDescription(entry.description[language], language, descriptionValuesOf(entry))]] : []),
  ])) as Record<BuildingMessageKey, string>;
}
