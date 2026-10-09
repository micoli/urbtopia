import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { COLLECTION_NAMES, specOf, type CollectionName, type Collections, type Definition } from './collections.ts';
import { SINGLETON_NAMES, singletonSpecOf, type SingletonName, type Singletons } from './singletons.ts';

export const DEFS_ROOT = 'assets/defs';

export const collectionDir = (name: CollectionName, root = DEFS_ROOT) => join(root, specOf(name).dir);

export const idOfFile = (file: string) => basename(file, '.json');

export const jsonFilesIn = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter(file => file.endsWith('.json')) : []);

const withoutSchema = ({ $schema: _schema, ...definition }: Definition): Definition => definition;

const orderOf = (definition: Definition) => (typeof definition.order === 'number' ? definition.order : 0);

// Node side of the game's import.meta.glob: the files of a directory, in their `order`.
export function readCollectionDir(dir: string): Record<string, Definition> {
  const entries = jsonFilesIn(dir).map((file): [string, Definition] => [idOfFile(file), withoutSchema(JSON.parse(readFileSync(join(dir, file), 'utf8')))]);
  return Object.fromEntries(entries.sort(([idA, a], [idB, b]) => orderOf(a) - orderOf(b) || idA.localeCompare(idB)));
}

export const readCollection = (name: CollectionName, root = DEFS_ROOT) => readCollectionDir(collectionDir(name, root));

export const readSingleton = (name: SingletonName): Record<string, unknown> => withoutSchema(JSON.parse(readFileSync(singletonSpecOf(name).file, 'utf8')));

export const readSingletons = (): Singletons => Object.fromEntries(SINGLETON_NAMES.map(name => [name, readSingleton(name)])) as Singletons;

export const readCollections = (root = DEFS_ROOT): Collections => Object.fromEntries(COLLECTION_NAMES.map(name => [name, readCollection(name, root)])) as Collections;
