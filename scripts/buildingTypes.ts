import { writeFileSync } from 'node:fs';
import type { ModelDefinition } from '../src/scene/modelDefinitions.ts';

export const BUILDING_TYPES_FILE = 'src/core/buildings/buildingTypes.generated.ts';

const unionOf = (ids: string[]) => (ids.length ? ids.map(id => `\n  | '${id}'`).join('') : ' never');

export function buildingTypesSource(definitions: Record<string, ModelDefinition>): string {
  const idsOf = (kind: 'sport' | 'nature') => Object.values(definitions).flatMap(definition => (definition.building?.kind === kind ? [definition.building.id] : [])).sort();
  return `// Generated from assets/models.json by scripts/buildingTypes.ts. Do not edit.\nexport type SportVenueType =${unionOf(idsOf('sport'))};\n\nexport type NatureType =${unionOf(idsOf('nature'))};\n`;
}

export function writeBuildingTypes(definitions: Record<string, ModelDefinition>, file = BUILDING_TYPES_FILE): void {
  writeFileSync(file, buildingTypesSource(definitions));
}
