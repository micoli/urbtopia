import { existsSync, readFileSync } from 'node:fs';
import { readCollections, readSingleton } from './collectionRead.ts';
import { SINGLETON_NAMES, singletonSpecOf } from './singletons.ts';
import { COLLECTION_NAMES, specOf } from './collections.ts';
import { readModels } from './modelsFile.ts';
import type { QuaterniusPack } from './quaternius.ts';

const modelFiles = readModels();
const collections = readCollections();
const fileOf = ({ id }: { id: string }) => modelFiles[id]?.file ?? id;
export const DEFINITION_MODEL_FILES = [
  ...COLLECTION_NAMES.flatMap(name => Object.values(collections[name]).flatMap(definition => specOf(name).references(definition as never).filter(({ target }) => target === 'models').map(fileOf))),
  ...SINGLETON_NAMES.flatMap(name => (singletonSpecOf(name).references?.(readSingleton(name) as never) ?? []).map(fileOf)),
];

const MANAGED_FILES = new Set(Object.values(modelFiles).filter(({ source }) => source === 'managed').map(({ file }) => file));

// A pack installs the files listed below plus every model a definition uses: a Game object can take any model of an installable pack.
const withDefinitionModels = <T extends { name: string; files: string[] }>(pack: T): T => {
  const used = DEFINITION_MODEL_FILES.filter(model => !MANAGED_FILES.has(model) && model.startsWith(`${pack.name}/`)).map(model => model.slice(pack.name.length + 1));
  return { ...pack, files: [...new Set([...pack.files, ...used])] };
};

// Packs added with tools/assets-editor: the archive is listed for browsing, none of its models is installed for the game.
export const EXTRA_PACKS_FILE = 'assets/extra-packs.json';

export interface ExtraPacks {
  quaternius: { name: string; archive: string }[];
}

export const readExtraPacks = (file = EXTRA_PACKS_FILE): ExtraPacks => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { quaternius: [] });

const extraPacks = readExtraPacks();

// Quaternius packs (CC0) ship FBX only: they are converted to GLB at install time so the runtime keeps one GLTF loader.
export const QUATERNIUS_PACKS: QuaterniusPack[] = [
  ...extraPacks.quaternius.map(({ name, archive }) => ({ name, archive, files: [] })),
].map(withDefinitionModels);

export const QUATERNIUS_ARCHIVES_DIR = 'assets/quaternus';
export const MODELS_DIR = 'public/models';
export const MANAGED_MODELS_DIR = 'assets/managed-models';
