import { writeFileSync } from 'node:fs';
import type { BuildingDefinitions, BuildingKind } from '../src/core/buildings/buildingDefinition.ts';

export const BUILDING_TYPES_FILE = 'src/core/buildings/buildingTypes.generated.ts';

const unionOf = (ids: string[]) => (ids.length ? ids.map(id => `\n  | '${id}'`).join('') : ' never');

export function buildingTypesSource(definitions: BuildingDefinitions): string {
  const idsOf = (kind?: BuildingKind) => Object.entries(definitions).filter(([, definition]) => !kind || definition.kind === kind).map(([id]) => id).sort();
  return [
    '// Generated from assets/defs/buildings by scripts/buildingTypes.ts. Do not edit.',
    `export type BuildingId =${unionOf(idsOf())};`,
    '',
    `export type SportVenueType =${unionOf(idsOf('sport'))};`,
    '',
    `export type NatureType =${unionOf(idsOf('nature'))};`,
    '',
  ].join('\n');
}

export function writeBuildingTypes(definitions: BuildingDefinitions, file = BUILDING_TYPES_FILE): void {
  writeFileSync(file, buildingTypesSource(definitions));
}
