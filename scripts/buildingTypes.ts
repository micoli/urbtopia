import { writeFileSync } from 'node:fs';
import type { BuildingDefinitions } from '../src/core/buildings/buildingDefinition.ts';

export const BUILDING_TYPES_FILE = 'src/core/buildings/buildingTypes.generated.ts';

const unionOf = (ids: string[]) => (ids.length ? ids.map(id => `\n  | '${id}'`).join('') : ' never');

export function buildingTypesSource(definitions: BuildingDefinitions): string {
  const idsWhere = (has: (definition: BuildingDefinitions[string]) => boolean) => Object.entries(definitions).filter(([, definition]) => has(definition)).map(([id]) => id).sort();
  return [
    '// Generated from assets/buildings.json by scripts/buildingTypes.ts. Do not edit.',
    `export type BuildingId =${unionOf(idsWhere(() => true))};`,
    '',
    `export type SportVenueType =${unionOf(idsWhere(definition => definition.sport !== undefined))};`,
    '',
    `export type NatureType =${unionOf(idsWhere(definition => definition.nature !== undefined))};`,
    '',
  ].join('\n');
}

export function writeBuildingTypes(definitions: BuildingDefinitions, file = BUILDING_TYPES_FILE): void {
  writeFileSync(file, buildingTypesSource(definitions));
}
