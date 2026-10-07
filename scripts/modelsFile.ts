import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { NATURE_FAMILIES } from '../src/core/environment/natureFamilies.ts';
import type { ModelDefinition } from '../src/scene/modelDefinitions.ts';
import { writeBuildingTypes } from './buildingTypes.ts';

export const MODELS_FILE = 'assets/models.json';

const FIELD_ORDER: (keyof ModelDefinition)[] = ['source', 'license', 'author', 'url', 'footprint', 'scale', 'center', 'fit', 'rotationOffset', 'bakeNodeScale', 'recolor', 'note', 'building'];
const SOURCES = ['kenney', 'quaternius', 'managed', 'poly.pizza'];
const HEX = /^#[0-9a-f]{6}$/i;
const BUILDING_ID = /^[a-z][A-Za-z0-9-]*$/;
const isCount = (value: unknown) => Number.isInteger(value) && (value as number) >= 0;

export type ModelDefinitions = Record<string, ModelDefinition>;

export function definitionProblems(definition: ModelDefinition): string[] {
  const problems: string[] = [];
  if (!SOURCES.includes(definition.source)) problems.push('unknown source');
  if (!definition.license?.trim()) problems.push('license is required');
  if (definition.footprint?.some((side) => !Number.isInteger(side) || side < 1)) problems.push('footprint sides must be integers >= 1');
  const colors = definition.recolor ? [definition.recolor.color, ...Object.values(definition.recolor.variants ?? {})] : [];
  if (colors.some((color) => !HEX.test(color))) problems.push('recolor colors must be #rrggbb');
  return [...problems, ...buildingProblems(definition)];
}

function buildingProblems(definition: ModelDefinition): string[] {
  const { building } = definition;
  if (!building) return [];
  const problems: string[] = [];
  if (!BUILDING_ID.test(building.id ?? '')) problems.push('building id must start with a letter and use letters, digits or hyphens');
  if (!building.name?.en?.trim() || !building.name.fr?.trim()) problems.push('building name is required in en and fr');
  if (building.kind === 'nature') {
    if (!(building.family in NATURE_FAMILIES)) problems.push('unknown nature family');
    return problems;
  }
  if (building.kind !== 'sport') return [...problems, 'unknown building kind'];
  if (!building.description?.en?.trim() || !building.description.fr?.trim()) problems.push('building description is required in en and fr');
  if (!definition.footprint) problems.push('a sport building needs a footprint');
  if (!isCount(building.unlockCitizens) || !isCount(building.cost) || !isCount(building.wellbeingBonus)) problems.push('unlock, cost and bonus must be integers >= 0');
  if (!Number.isInteger(building.radius) || building.radius < 1) problems.push('radius must be an integer >= 1');
  return problems;
}

function duplicateBuildingIds(definitions: ModelDefinitions): string[] {
  const seen = new Set<string>();
  return Object.values(definitions).flatMap(({ building }) => {
    if (!building) return [];
    if (!seen.has(building.id)) return seen.add(building.id), [];
    return [`building id ${building.id} is used by several models`];
  });
}

export function stableModelsJson(definitions: ModelDefinitions): string {
  const ordered = Object.fromEntries(
    Object.keys(definitions).sort().map((key) => {
      const definition = definitions[key] as ModelDefinition;
      return [key, Object.fromEntries(FIELD_ORDER.filter((field) => definition[field] !== undefined).map((field) => [field, definition[field]]))];
    }),
  );
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

export const readModels = (file = MODELS_FILE): ModelDefinitions => JSON.parse(readFileSync(file, 'utf8'));

export function writeModels(definitions: ModelDefinitions, file = MODELS_FILE): void {
  const problems = [...Object.entries(definitions).flatMap(([key, definition]) => definitionProblems(definition).map((problem) => `${key}: ${problem}`)), ...duplicateBuildingIds(definitions)];
  if (problems.length) throw new Error(problems.join('; '));
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, stableModelsJson(definitions));
  renameSync(temporary, file);
  if (file === MODELS_FILE) writeBuildingTypes(definitions);
}
