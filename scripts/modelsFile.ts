import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import type { ModelDefinition } from '../src/scene/modelDefinitions.ts';

export const MODELS_FILE = 'assets/models.json';

const FIELD_ORDER: (keyof ModelDefinition)[] = ['source', 'license', 'author', 'url', 'footprint', 'scale', 'center', 'fit', 'rotationOffset', 'bakeNodeScale', 'recolor', 'note'];
const SOURCES = ['kenney', 'quaternius', 'managed', 'poly.pizza'];
const HEX = /^#[0-9a-f]{6}$/i;

export type ModelDefinitions = Record<string, ModelDefinition>;

export function definitionProblems(definition: ModelDefinition): string[] {
  const problems: string[] = [];
  if (!SOURCES.includes(definition.source)) problems.push('unknown source');
  if (!definition.license?.trim()) problems.push('license is required');
  if (definition.footprint?.some((side) => !Number.isInteger(side) || side < 1)) problems.push('footprint sides must be integers >= 1');
  const colors = definition.recolor ? [definition.recolor.color, ...Object.values(definition.recolor.variants ?? {})] : [];
  if (colors.some((color) => !HEX.test(color))) problems.push('recolor colors must be #rrggbb');
  return problems;
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
  const problems = Object.entries(definitions).flatMap(([key, definition]) => definitionProblems(definition).map((problem) => `${key}: ${problem}`));
  if (problems.length) throw new Error(problems.join('; '));
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, stableModelsJson(definitions));
  renameSync(temporary, file);
}
