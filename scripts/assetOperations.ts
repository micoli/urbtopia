import { existsSync, mkdirSync, readdirSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { EXTRA_PACKS_FILE, MANAGED_MODELS_DIR, POLY_PIZZA_DIR, ARCHIVES_DIR, QUATERNIUS_ARCHIVES_DIR, readExtraPacks } from './assetPacks.ts';
import { extractFbx, extractPack } from './extractPack.ts';
import { writeCollection, writeSingleton } from './collectionFiles.ts';
import { DEFS_ROOT, collectionDir, readCollection, readSingleton, singletonFileIn } from './collectionRead.ts';
import { COLLECTION_NAMES, specOf, type Definition } from './collections.ts';
import { SINGLETON_NAMES, singletonSpecOf } from './singletons.ts';
import { pathOf, setIn } from './paths.ts';
import { MODELS_FILE, idByFile, modelIdOf, readModels, writeModels } from './modelsFile.ts';
import { licenseText, type PolyPizzaModel } from './polyPizza.ts';

export interface AssetPaths {
  managed: string;
  polyPizza: string;
  kenney: string;
  quaternius: string;
  models: string;
  extraPacks: string;
  defs: string;
}

export const ASSET_PATHS: AssetPaths = { managed: MANAGED_MODELS_DIR, polyPizza: POLY_PIZZA_DIR, kenney: ARCHIVES_DIR, quaternius: QUATERNIUS_ARCHIVES_DIR, models: MODELS_FILE, extraPacks: EXTRA_PACKS_FILE, defs: DEFS_ROOT };

export interface Attribution {
  license: string;
  author?: string;
  url?: string;
  note?: string;
}

const requireLicense = (license: string) => {
  if (!license.trim()) throw new Error('A license is required to add an asset');
};

const requireName = (label: string, value: string) => {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) throw new Error(`${label} must be lowercase letters, digits and dashes: ${value}`);
};

const defined = <T extends object>(value: T): T => Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== '')) as T;

export function addGlb(input: { category: string; name: string; data: Uint8Array } & Attribution, paths = ASSET_PATHS): string {
  requireLicense(input.license);
  requireName('category', input.category);
  requireName('name', input.name);
  const key = `${input.category}/${input.name}`;
  const target = join(paths.managed, `${key}.glb`);
  if (existsSync(target)) throw new Error(`${key} already exists`);
  const models = readModels(paths.models);
  const id = modelIdOf(key);
  if (models[id] || idByFile(models).has(key)) throw new Error(`${key} already has a definition`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, input.data);
  writeModels({ ...models, [id]: defined({ file: key, source: 'managed' as const, license: input.license.trim(), author: input.author?.trim(), url: input.url?.trim(), note: input.note?.trim() }) }, paths.models);
  return key;
}

export function addPolyPizzaModel(model: PolyPizzaModel, license: string, paths = ASSET_PATHS): string {
  requireLicense(license);
  const key = `poly.pizza/${model.slug}`;
  const directory = join(paths.polyPizza, model.slug);
  if (existsSync(directory)) throw new Error(`${key} already exists`);
  const models = readModels(paths.models);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `${model.slug}.glb`), model.glb);
  writeFileSync(join(directory, 'license.txt'), licenseText({ title: model.title, author: model.author, publicID: model.url.split('/m/')[1] ?? '', licence: license.trim() }));
  writeModels({ ...models, [modelIdOf(key)]: defined({ file: key, source: 'poly.pizza' as const, license: license.trim(), author: model.author, url: model.url }) }, paths.models);
  return key;
}

export function addPack(input: { kind: 'kenney' | 'quaternius'; name: string; archive: string; data: Uint8Array }, paths = ASSET_PATHS): void {
  requireName('pack name', input.name);
  if (!/^[\w.-]+\.zip$/.test(input.archive)) throw new Error(`Not a zip file name: ${input.archive}`);
  const extra = readExtraPacks(paths.extraPacks);
  const registered = [...extra.kenney, ...extra.quaternius].some((pack) => pack.name === input.name);
  const target = join(paths[input.kind], input.archive);
  if (registered || existsSync(target)) throw new Error(`Pack ${input.name} or archive ${input.archive} already exists`);

  if (input.kind === 'quaternius') {
    if (extractFbx(input.data).length === 0) throw new Error('No FBX model in the archive');
    extra.quaternius.push({ name: input.name, archive: input.archive });
  } else {
    const colormap = hasColormap(input.data);
    if (extractPack(input.data, 'all', colormap).filter((file) => file.path.endsWith('.glb')).length === 0) throw new Error('No GLB model in the archive');
    extra.kenney.push({ name: input.name, archive: input.archive, colormap });
  }
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, input.data);
  writeFileSync(paths.extraPacks, `${JSON.stringify(extra, null, 2)}\n`);
}

function hasColormap(zip: Uint8Array): boolean {
  try {
    extractPack(zip, 'all', true);
    return true;
  } catch {
    return false;
  }
}

export function removeModel(key: string, usedKeys: readonly string[], paths = ASSET_PATHS): void {
  if (usedKeys.includes(key)) throw new Error(`${key} is used in the game`);
  const models = readModels(paths.models);
  const polySlug = key.match(/^poly\.pizza\/([^/]+)$/)?.[1];
  if (polySlug) rmSync(join(paths.polyPizza, polySlug), { recursive: true, force: true });
  else {
    const file = join(paths.managed, `${key}.glb`);
    if (!existsSync(file)) throw new Error(`${key} is not a hand-made or Poly Pizza model`);
    rmSync(file);
    const directory = dirname(file);
    if (readdirSync(directory).length === 0) rmdirSync(directory);
  }
  if (!idByFile(models).has(key)) return;
  writeModels(Object.fromEntries(Object.entries(models).filter(([, { file }]) => file !== key)), paths.models);
}

const rewire = (definition: Definition, references: { id: string; path: string }[], from: string, to: string): Definition =>
  references.filter(({ id }) => id === from).reduce((current, { path }) => setIn(current, pathOf(path), to) as Definition, definition);

// Model ids live in definitions only, never in saves: a rename rewrites every Game object that uses the model.
export function renameModel(from: string, to: string, paths = ASSET_PATHS): void {
  const models = readModels(paths.models);
  if (!models[from]) throw new Error(`Unknown Model id ${from}`);
  if (models[to]) throw new Error(`Model id ${to} already exists`);
  const renamed = Object.fromEntries(Object.entries(models).map(([id, definition]) => [id === from ? to : id, definition]));
  const rewired = COLLECTION_NAMES.map(name => {
    const modelReferences = (definition: Definition) => specOf(name).references(definition as never).filter(({ target }) => target === 'models');
    const definitions = Object.fromEntries(Object.entries(readCollection(name, paths.defs)).map(([id, definition]) => [id, rewire(definition, modelReferences(definition), from, to)]));
    const dangling = Object.entries(definitions).filter(([, definition]) => modelReferences(definition).some(({ id }) => !renamed[id])).map(([id]) => id);
    if (dangling.length) throw new Error(`${specOf(name).title} with an unknown model: ${dangling.join(', ')}`);
    return { name, definitions };
  });
  const singletons = SINGLETON_NAMES.filter(name => existsSync(singletonFileIn(name, paths.defs))).map(name => {
    const value = readSingleton(name, paths.defs);
    const references = singletonSpecOf(name).references?.(value as never) ?? [];
    return { name, value: references.reduce((current, { id, path }) => (id === from ? (setIn(current, pathOf(path), to) as Record<string, unknown>) : current), value) };
  });
  writeModels(renamed, paths.models);
  for (const { name, definitions } of rewired) writeCollection(name, definitions, collectionDir(name, paths.defs));
  for (const { name, value } of singletons) writeSingleton(name, value, paths.defs);
}
