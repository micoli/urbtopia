import type { z } from 'zod';
import type { BuildingDefinitions } from '../src/core/buildings/buildingDefinition.ts';
import { BUILDING_ID_PATTERN, buildingSchema } from '../src/core/buildings/buildingSchema.ts';
import { MODEL_ID_PATTERN, modelSchema, type ModelEntry } from '../src/core/models/modelSchema.ts';

// Pure checks shared by the scripts, the build and the assets editor, which runs them live in the browser.

export interface Problem {
  id: string;
  path: string;
  message: string;
}

export type ModelDefinitions = Record<string, ModelEntry>;

export interface ModelCatalog {
  models: ModelDefinitions;
  // Whether the game can install the file: a model of an installable pack, a hand-made or a Poly Pizza model.
  ships: (file: string) => boolean;
}

export const describeProblem = ({ id, path, message }: Problem): string => `${id}: ${path ? `${path}: ` : ''}${message}`;

const schemaProblems = (id: string, schema: z.ZodType, definition: unknown): Problem[] => {
  const result = schema.safeParse(definition);
  if (result.success) return [];
  return result.error.issues.map(issue => ({ id, path: issue.path.join('.'), message: issue.message }));
};

export const buildingProblemsOf = (id: string, definition: unknown): Problem[] => schemaProblems(id, buildingSchema, definition);

export const modelProblemsOf = (id: string, definition: unknown): Problem[] => schemaProblems(id, modelSchema, definition);

export function modelReferenceProblems(definitions: Record<string, { model: string }>, { models, ships }: ModelCatalog): Problem[] {
  return Object.entries(definitions).flatMap(([id, { model }]) => {
    const file = models[model]?.file;
    if (!file) return [{ id, path: 'model', message: `unknown Model id ${model}` }];
    return ships(file) ? [] : [{ id, path: 'model', message: `model ${model} has no installable file ${file}` }];
  });
}

export function allBuildingProblems(definitions: BuildingDefinitions, catalog?: ModelCatalog): Problem[] {
  const seen = new Set<string>();
  const idProblems = Object.keys(definitions).flatMap((id): Problem[] => {
    const folded = id.toLowerCase();
    const duplicate = seen.has(folded);
    seen.add(folded);
    return [
      ...(BUILDING_ID_PATTERN.test(id) ? [] : [{ id, path: '', message: 'id must start with a letter and use letters, digits or hyphens' }]),
      ...(duplicate ? [{ id, path: '', message: 'id differs from another one by case only' }] : []),
    ];
  });
  const definitionProblems = Object.entries(definitions).flatMap(([id, definition]) => buildingProblemsOf(id, definition));
  return [...idProblems, ...definitionProblems, ...(catalog ? modelReferenceProblems(definitions, catalog) : [])];
}

export function allModelProblems(definitions: ModelDefinitions): Problem[] {
  const owners = new Map<string, string>();
  return Object.entries(definitions).flatMap(([id, definition]): Problem[] => {
    const owner = owners.get(definition.file);
    owners.set(definition.file, id);
    return [
      ...(MODEL_ID_PATTERN.test(id) ? [] : [{ id, path: '', message: 'id must be lowercase letters and digits separated by single dashes' }]),
      ...(owner ? [{ id, path: 'file', message: `${definition.file} already belongs to ${owner}` }] : []),
      ...modelProblemsOf(id, definition),
    ];
  });
}

// The Model id given to a file at migration or import: `suburban/building-type-k` becomes `suburban-building-type-k`.
export const modelIdOf = (file: string): string => file.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
