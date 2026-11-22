import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { z } from 'zod';
import { DEFS_ROOT, collectionDir, singletonFileIn, idOfFile, jsonFilesIn, orderFileOf, readCollection, readCollections, readOrder } from './collectionRead.ts';
import { singletonSpecOf, type SingletonName } from './singletons.ts';
import { fieldOrderOf, specOf, type CollectionName, type Definition } from './collections.ts';
import { collectionProblems, describeProblem, singletonProblems, type ReferenceContext } from './definitionProblems.ts';
import { shippedModelCatalog } from './modelReferences.ts';
import { listedFixtureIds, mergedOrder } from './fixtureOrder.ts';

export const SCHEMAS_DIR = `${DEFS_ROOT}/schemas`;

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
  `${inlineScalarArrays(JSON.stringify({ $schema: relative(dirname(singletonSpecOf(name).file), singletonSchemaFileOf(name)), ...value }, null, 2))}\n`;

export function writeSingleton(name: SingletonName, value: Record<string, unknown>, root = DEFS_ROOT): void {
  const problems = singletonProblems(name, value);
  if (problems.length) throw new Error(problems.map(describeProblem).join('; '));
  writeIfChanged(singletonFileIn(name, root), stableSingletonJson(name, value));
  if (root === DEFS_ROOT) writeIfChanged(singletonSchemaFileOf(name), singletonJsonSchemaOf(name));
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

// One id per line, so that adding or moving a Game object changes a single line of the file.
export const orderJson = (ids: readonly string[]): string => `${JSON.stringify(ids, null, 2)}\n`;

const realContext = (name: CollectionName, definitions: Record<string, Definition>): ReferenceContext => ({ collections: { ...readCollections(), [name]: definitions }, catalog: shippedModelCatalog() });

// The order file of the Fixtures also lists those that templates unfold into, which have no file of their own.
const writeFixtureOrder = (fixtures: Record<string, Definition>, templates: Record<string, Definition>) => {
  const file = orderFileOf(collectionDir('fixtures'));
  writeIfChanged(file, orderJson(mergedOrder(readOrder(collectionDir('fixtures')), listedFixtureIds(fixtures, templates))));
};

const orderedIds = (name: CollectionName, definitions: Record<string, Definition>, real: boolean): string[] =>
  name === 'fixtures' && real ? mergedOrder(readOrder(collectionDir('fixtures')), listedFixtureIds(definitions, readCollection('fixtureTemplates'))) : Object.keys(definitions);

// The order of the entries is the menu order, stored as a list of ids in the order file of the directory. Writing the real directory also regenerates its id unions and JSON Schema.
export function writeCollection(name: CollectionName, definitions: Record<string, Definition>, dir = collectionDir(name)): void {
  const real = dir === collectionDir(name);
  const problems = collectionProblems(name, definitions, real ? realContext(name, definitions) : undefined);
  if (problems.length) throw new Error(problems.map(describeProblem).join('; '));
  mkdirSync(dir, { recursive: true });
  for (const [id, definition] of Object.entries(definitions)) writeIfChanged(join(dir, `${id}.json`), stableDefinitionJson(name, definition));
  for (const file of jsonFilesIn(dir)) if (!(idOfFile(file) in definitions)) rmSync(join(dir, file));
  writeIfChanged(orderFileOf(dir), orderJson(orderedIds(name, definitions, real)));
  if (!real) return;
  if (name === 'fixtureTemplates') writeFixtureOrder(readCollection('fixtures'), definitions);
  writeIfChanged(specOf(name).idTypes.file, idTypesSource(name, definitions));
  writeIfChanged(schemaFileOf(name), jsonSchemaOf(name));
}
