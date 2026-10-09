import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { modelsFileSchema, type ModelEntry } from '../src/core/models/modelSchema.ts';
import { allModelProblems, describeProblem, modelProblemsOf, type ModelDefinitions } from './definitionProblems.ts';

export { modelIdOf, type ModelDefinitions } from './definitionProblems.ts';

export const MODELS_FILE = 'assets/models.json';
export const MODELS_SCHEMA_FILE = 'assets/defs/schemas/models.schema.json';
export const MODEL_IDS_FILE = 'src/core/models/modelIds.generated.ts';

const SCHEMA_REFERENCE = 'defs/schemas/models.schema.json';
const FIELD_ORDER: (keyof ModelEntry)[] = ['file', 'source', 'license', 'author', 'url', 'footprint', 'scale', 'center', 'fit', 'rotationOffset', 'bakeNodeScale', 'recolor', 'note'];

export const modelProblems = (definition: unknown): string[] => modelProblemsOf('', definition).map(({ path, message }) => (path ? `${path}: ${message}` : message));

export const modelsProblems = (definitions: ModelDefinitions): string[] => allModelProblems(definitions).map(describeProblem);

export function stableModelsJson(definitions: ModelDefinitions): string {
  const ordered = Object.keys(definitions).sort().map(id => {
    const definition = definitions[id]!;
    return [id, Object.fromEntries(FIELD_ORDER.filter(field => definition[field] !== undefined).map(field => [field, definition[field]]))];
  });
  return `${JSON.stringify({ $schema: SCHEMA_REFERENCE, ...Object.fromEntries(ordered) }, null, 2)}\n`;
}

export const modelsJsonSchema = (): string => `${JSON.stringify(z.toJSONSchema(modelsFileSchema), null, 2)}\n`;

export const modelIdsSource = (definitions: ModelDefinitions): string => {
  const ids = Object.keys(definitions).sort();
  return ['// Generated from assets/models.json by scripts/modelsFile.ts. Do not edit.', `export type ModelId =${ids.length ? ids.map(id => `\n  | '${id}'`).join('') : ' never'};`, ''].join('\n');
};

const withoutSchema = ({ $schema: _schema, ...definitions }: ModelDefinitions & { $schema?: unknown }): ModelDefinitions => definitions as ModelDefinitions;

export const readModels = (file = MODELS_FILE): ModelDefinitions => withoutSchema(JSON.parse(readFileSync(file, 'utf8')));

const writeAtomically = (file: string, content: string) => {
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, content);
  renameSync(temporary, file);
};

export function writeModels(definitions: ModelDefinitions, file = MODELS_FILE): void {
  const problems = modelsProblems(definitions);
  if (problems.length) throw new Error(problems.join('; '));
  writeAtomically(file, stableModelsJson(definitions));
  if (file !== MODELS_FILE) return;
  writeFileSync(MODEL_IDS_FILE, modelIdsSource(definitions));
  mkdirSync(dirname(MODELS_SCHEMA_FILE), { recursive: true });
  writeFileSync(MODELS_SCHEMA_FILE, modelsJsonSchema());
}

export const idByFile = (definitions: ModelDefinitions): Map<string, string> => new Map(Object.entries(definitions).map(([id, { file }]) => [file, id]));
