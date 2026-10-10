import type { z } from 'zod';
import type { BuildingDefinitions, FlatBuilding } from '../src/core/buildings/buildingDefinition.ts';
import { descriptionProblemsOf } from '../src/core/descriptions/descriptionProblems.ts';
import { buildingSchema } from '../src/core/buildings/buildingSchema.ts';
import { MODEL_ID_PATTERN, modelSchema, type ModelEntry } from '../src/core/models/modelSchema.ts';
import { COLLECTION_NAMES, specOf, type CollectionName, type Collections, type Definition, type Reference } from './collections.ts';
import { SINGLETON_NAMES, singletonSpecOf, type SingletonName, type Singletons } from './singletons.ts';

// Pure checks shared by the scripts, the build and the assets editor, which runs them live in the browser.

export interface Problem {
  id: string;
  path: string;
  message: string;
}

export type CollectionProblem = Problem & { collection: CollectionName };

export type ModelDefinitions = Record<string, ModelEntry>;

export interface ModelCatalog {
  models: ModelDefinitions;
  // Whether the game can install the file: a model of an installable pack, a hand-made or a Poly Pizza model.
  ships: (file: string) => boolean;
}

export interface ReferenceContext {
  collections: Partial<Collections>;
  catalog?: ModelCatalog;
}

export const describeProblem = ({ id, path, message }: Problem): string => `${id}: ${path ? `${path}: ` : ''}${message}`;

const schemaProblems = (id: string, schema: z.ZodType, definition: unknown): Problem[] => {
  const result = schema.safeParse(definition);
  if (result.success) return [];
  return result.error.issues.map(issue => ({ id, path: issue.path.join('.'), message: issue.message }));
};

export const buildingProblemsOf = (id: string, definition: unknown): Problem[] => schemaProblems(id, buildingSchema, definition);

export const modelProblemsOf = (id: string, definition: unknown): Problem[] => schemaProblems(id, modelSchema, definition);

function referenceProblem(owner: string, { target, id, path }: Reference, { collections, catalog }: ReferenceContext): Problem[] {
  if (target === 'models') {
    if (!catalog) return [];
    const file = catalog.models[id]?.file;
    if (!file) return [{ id: owner, path, message: `unknown Model id ${id}` }];
    return catalog.ships(file) ? [] : [{ id: owner, path, message: `model ${id} has no installable file ${file}` }];
  }
  const known = target.filter(name => collections[name as CollectionName]);
  if (!known.length || known.some(name => id in collections[name as CollectionName]!)) return [];
  return [{ id: owner, path, message: `unknown ${target.join(' or ')} id ${id}` }];
}

// A specialised Shop lists, at every Tier, only Goods of its own Good category.
function shopCategoryProblems(id: string, definition: FlatBuilding, goods: Record<string, Definition>): Problem[] {
  if (definition.kind !== 'shop' || definition.goodCategory === 'all') return [];
  return (definition.tiers ?? []).flatMap((tier, index) =>
    ((tier as { sells?: string[] }).sells ?? []).flatMap((good, position): Problem[] =>
      !goods[good] || goods[good].category === definition.goodCategory ? [] : [{ id, path: `tiers.${index}.sells.${position}`, message: `${good} is a ${String(goods[good].category)} Good, not ${definition.goodCategory}` }],
    ),
  );
}

// Ids, shape and references of one collection; references are only checked against what the context holds.
export function collectionProblems(name: CollectionName, definitions: Record<string, Definition>, context?: ReferenceContext): Problem[] {
  const spec = specOf(name);
  const seen = new Set<string>();
  const idProblems = Object.keys(definitions).flatMap((id): Problem[] => {
    const folded = id.toLowerCase();
    const duplicate = seen.has(folded);
    seen.add(folded);
    return [
      ...(spec.idPattern.test(id) ? [] : [{ id, path: '', message: `id must ${spec.idRule}` }]),
      ...(duplicate ? [{ id, path: '', message: 'id differs from another one by case only' }] : []),
    ];
  });
  const shapeProblems = Object.entries(definitions).flatMap(([id, definition]) => {
    const shape = schemaProblems(id, spec.schema, definition);
    return shape.length || name !== 'buildings' ? shape : descriptionProblemsOf(definition as FlatBuilding).map(problem => ({ id, ...problem }));
  });
  const references = context ? Object.entries(definitions).flatMap(([id, definition]) => spec.references(definition as never).flatMap(reference => referenceProblem(id, reference, context))) : [];
  const goods = context?.collections.goods;
  const categories = goods && name === 'buildings' ? Object.entries(definitions).flatMap(([id, definition]) => shopCategoryProblems(id, definition as FlatBuilding, goods)) : [];
  return [...idProblems, ...shapeProblems, ...references, ...categories];
}

export const allCollectionProblems = (collections: Collections, catalog: ModelCatalog): CollectionProblem[] =>
  COLLECTION_NAMES.flatMap(name => collectionProblems(name, collections[name], { collections, catalog }).map(problem => ({ ...problem, collection: name })));

// Shape and, given a context, the Model ids it points to; references are only checked when the shape holds.
export function singletonProblems(name: SingletonName, value: unknown, context?: ReferenceContext): Problem[] {
  const spec = singletonSpecOf(name);
  const shape = schemaProblems(name, spec.schema, value);
  if (shape.length) return shape;
  const checks = (spec.problems?.(value as never) ?? []).map(problem => ({ id: name, ...problem }));
  const references = context && spec.references ? spec.references(value as never).flatMap(reference => referenceProblem(name, reference, context)) : [];
  return [...checks, ...references];
}

export const allSingletonProblems = (singletons: Singletons, context?: ReferenceContext): Problem[] => SINGLETON_NAMES.flatMap(name => singletonProblems(name, singletons[name], context));

export const allBuildingProblems = (definitions: BuildingDefinitions, catalog?: ModelCatalog): Problem[] =>
  collectionProblems('buildings', definitions as Record<string, Definition>, catalog ? { collections: {}, catalog } : undefined);

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
