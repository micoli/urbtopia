import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { BUILD_SECTION_TITLES } from '../src/core/buildings/buildSections.ts';
import type { BuildingDefinition, BuildingDefinitions } from '../src/core/buildings/buildingDefinition.ts';
import { NATURE_FAMILIES } from '../src/core/environment/natureFamilies.ts';
import { writeBuildingTypes } from './buildingTypes.ts';

export const BUILDINGS_FILE = 'assets/buildings.json';

const FIELD_ORDER: (keyof BuildingDefinition)[] = ['section', 'model', 'footprint', 'cost', 'unlockCitizens', 'requiresRoad', 'accessModes', 'initialSlots', 'name', 'description', 'sport', 'nature'];
const BUILDING_ID = /^[a-z][A-Za-z0-9-]*$/;
const isCount = (value: unknown) => Number.isInteger(value) && (value as number) >= 0;
const isBlank = (text: string | undefined) => !text?.trim();

export function buildingProblems(definition: BuildingDefinition): string[] {
  const problems: string[] = [];
  if (isBlank(definition.model)) problems.push('model is required');
  if (isBlank(definition.name?.en) || isBlank(definition.name?.fr)) problems.push('name is required in en and fr');
  if (definition.description && (isBlank(definition.description.en) || isBlank(definition.description.fr))) problems.push('description must be filled in en and fr, or removed');
  if (definition.sport && definition.nature) problems.push('a building cannot be both sport and nature');
  if (definition.nature) {
    if (!(definition.nature.family in NATURE_FAMILIES)) problems.push('unknown nature family');
    const ownedByFamily = (['section', 'footprint', 'cost', 'unlockCitizens', 'requiresRoad', 'accessModes', 'initialSlots'] as const).filter(field => definition[field] !== undefined);
    if (ownedByFamily.length) problems.push(`${ownedByFamily.join(', ')} come from the nature family`);
    return problems;
  }
  if (!definition.section || !BUILD_SECTION_TITLES.includes(definition.section)) problems.push('unknown section');
  if (!definition.footprint || definition.footprint.length !== 2 || definition.footprint.some(side => !Number.isInteger(side) || side < 1)) problems.push('footprint must be two integers >= 1');
  if (!isCount(definition.cost)) problems.push('cost must be an integer >= 0');
  if (!isCount(definition.unlockCitizens)) problems.push('unlockCitizens must be an integer >= 0');
  if (typeof definition.requiresRoad !== 'boolean') problems.push('requiresRoad must be true or false');
  if (definition.accessModes && (!definition.accessModes.length || definition.accessModes.some(mode => mode !== 'road' && mode !== 'brt'))) problems.push("accessModes must list 'road' and/or 'brt'");
  if (definition.accessModes && !definition.requiresRoad) problems.push('accessModes needs requiresRoad');
  if (definition.initialSlots !== undefined && !isCount(definition.initialSlots)) problems.push('initialSlots must be an integer >= 0');
  if (definition.sport && (!Number.isInteger(definition.sport.radius) || definition.sport.radius < 1 || !isCount(definition.sport.wellbeingBonus))) problems.push('sport needs radius >= 1 and wellbeingBonus >= 0');
  return problems;
}

export function stableBuildingsJson(definitions: BuildingDefinitions): string {
  const ordered = Object.fromEntries(
    Object.entries(definitions).map(([id, definition]) => [id, Object.fromEntries(FIELD_ORDER.filter(field => definition[field] !== undefined).map(field => [field, definition[field]]))]),
  );
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export const readBuildings = (file = BUILDINGS_FILE): BuildingDefinitions => JSON.parse(readFileSync(file, 'utf8'));

export function writeBuildings(definitions: BuildingDefinitions, file = BUILDINGS_FILE): void {
  const problems = Object.entries(definitions).flatMap(([id, definition]) => [
    ...(BUILDING_ID.test(id) ? [] : [`${id}: id must start with a letter and use letters, digits or hyphens`]),
    ...buildingProblems(definition).map(problem => `${id}: ${problem}`),
  ]);
  if (problems.length) throw new Error(problems.join('; '));
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, stableBuildingsJson(definitions));
  renameSync(temporary, file);
  if (file === BUILDINGS_FILE) writeBuildingTypes(definitions);
}
