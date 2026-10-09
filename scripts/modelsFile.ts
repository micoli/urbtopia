import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { MODEL_ID_PATTERN, modelSchema, modelsFileSchema, type ModelEntry } from '../src/core/models/modelSchema.ts';

export const MODELS_FILE = 'assets/models.json';
export const MODELS_SCHEMA_FILE = 'assets/defs/schemas/models.schema.json';
export const MODEL_IDS_FILE = 'src/core/models/modelIds.generated.ts';

const SCHEMA_REFERENCE = 'defs/schemas/models.schema.json';
const FIELD_ORDER: (keyof ModelEntry)[] = ['file', 'source', 'license', 'author', 'url', 'footprint', 'scale', 'center', 'fit', 'rotationOffset', 'bakeNodeScale', 'recolor', 'note'];

export type ModelDefinitions = Record<string, ModelEntry>;

// The Model id given to a file at migration or import: `suburban/building-type-k` becomes `suburban-building-type-k`.
export const modelIdOf = (file: string): string => file.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function modelProblems(definition: unknown): string[] {
  const result = modelSchema.safeParse(definition);
  if (result.success) return [];
  return result.error.issues.map(issue => (issue.path.length ? `${issue.path.join('.')} ${issue.message}` : issue.message));
}

export function modelsProblems(definitions: ModelDefinitions): string[] {
  const owners = new Map<string, string>();
  return Object.entries(definitions).flatMap(([id, definition]) => {
    const owner = owners.get(definition.file);
    owners.set(definition.file, id);
    return [
      ...(MODEL_ID_PATTERN.test(id) ? [] : [`${id}: id must be lowercase letters and digits separated by single dashes`]),
      ...(owner ? [`${id}: file ${definition.file} already belongs to ${owner}`] : []),
      ...modelProblems(definition).map(problem => `${id}: ${problem}`),
    ];
  });
}

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
