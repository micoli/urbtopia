import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { DEFS_ROOT, collectionDir, idOfFile, jsonFilesIn, readCollections } from './collectionRead.ts';
import { singletonSpecOf, type SingletonName } from './singletons.ts';
import { fieldOrderOf, specOf, type CollectionName, type Definition } from './collections.ts';
import { collectionProblems, describeProblem, singletonProblems, type ReferenceContext } from './definitionProblems.ts';
import { shippedModelCatalog } from './modelReferences.ts';

export const SCHEMAS_DIR = `${DEFS_ROOT}/schemas`;
const ORDER_STEP = 10;

export const schemaFileOf = (name: CollectionName) => `${SCHEMAS_DIR}/${specOf(name).schemaName}.schema.json`;

// JSON strings never hold a raw newline, so only real arrays of scalars are put on one line.
export const inlineScalarArrays = (json: string) => json.replace(/\[\n\s+([^[\]{}]*?)\n\s*\]/g, (_, items: string) => `[${items.split(/,\n\s+/).join(', ')}]`);

export function stableDefinitionJson(name: CollectionName, definition: Definition): string {
  const fields: Definition = { $schema: `../schemas/${specOf(name).schemaName}.schema.json`, ...definition };
  const order = fieldOrderOf(name);
  const keys = [...order.filter(key => key in fields), ...Object.keys(fields).filter(key => !order.includes(key))];
  return `${inlineScalarArrays(JSON.stringify(Object.fromEntries(keys.filter(key => fields[key] !== undefined).map(key => [key, fields[key]])), null, 2))}\n`;
}

export const singletonSchemaFileOf = (name: SingletonName) => `${SCHEMAS_DIR}/${singletonSpecOf(name).schemaName}.schema.json`;

export const singletonJsonSchemaOf = (name: SingletonName): string => `${JSON.stringify(z.toJSONSchema(singletonSpecOf(name).schema), null, 2)}\n`;

export const stableSingletonJson = (name: SingletonName, value: Record<string, unknown>): string =>
  `${inlineScalarArrays(JSON.stringify({ $schema: `schemas/${singletonSpecOf(name).schemaName}.schema.json`, ...value }, null, 2))}\n`;

export function writeSingleton(name: SingletonName, value: Record<string, unknown>): void {
  const problems = singletonProblems(name, value);
  if (problems.length) throw new Error(problems.map(describeProblem).join('; '));
  writeIfChanged(singletonSpecOf(name).file, stableSingletonJson(name, value));
  writeIfChanged(singletonSchemaFileOf(name), singletonJsonSchemaOf(name));
}

export const jsonSchemaOf = (name: CollectionName): string => `${JSON.stringify(z.toJSONSchema(specOf(name).schema), null, 2)}\n`;

const unionOf = (ids: string[]) => (ids.length ? ids.map(id => `\n  | '${id}'`).join('') : ' never');

export function idTypesSource(name: CollectionName, definitions: Record<string, Definition>): string {
  const unions = specOf(name).idTypes.unions(definitions as Record<string, never>);
  return [`// Generated from ${DEFS_ROOT}/${specOf(name).dir} by scripts/collectionFiles.ts. Do not edit.`, ...Object.entries(unions).flatMap(([type, ids]) => [`export type ${type} =${unionOf(ids)};`, ''])].join('\n');
}

export const writeIfChanged = (file: string, content: string) => {
  if (existsSync(file) && readFileSync(file, 'utf8') === content) return;
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  writeFileSync(temporary, content);
  renameSync(temporary, file);
};

export const ordered = (definitions: Record<string, Definition>): Record<string, Definition> =>
  Object.fromEntries(Object.entries(definitions).map(([id, definition], index) => [id, { ...definition, order: (index + 1) * ORDER_STEP }]));

const realContext = (name: CollectionName, definitions: Record<string, Definition>): ReferenceContext => ({ collections: { ...readCollections(), [name]: definitions }, catalog: shippedModelCatalog() });

// The order of the entries is the menu order, stored as `order` in steps of ten. Writing the real directory also regenerates its id unions and JSON Schema.
export function writeCollection(name: CollectionName, definitions: Record<string, Definition>, dir = collectionDir(name)): void {
  const entries = ordered(definitions);
  const real = dir === collectionDir(name);
  const problems = collectionProblems(name, entries, real ? realContext(name, entries) : undefined);
  if (problems.length) throw new Error(problems.map(describeProblem).join('; '));
  mkdirSync(dir, { recursive: true });
  for (const [id, definition] of Object.entries(entries)) writeIfChanged(join(dir, `${id}.json`), stableDefinitionJson(name, definition));
  for (const file of jsonFilesIn(dir)) if (!(idOfFile(file) in entries)) rmSync(join(dir, file));
  if (!real) return;
  writeIfChanged(specOf(name).idTypes.file, idTypesSource(name, entries));
  writeIfChanged(schemaFileOf(name), jsonSchemaOf(name));
}
