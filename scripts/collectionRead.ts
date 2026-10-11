import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { COLLECTION_NAMES, specOf, type CollectionName, type Collections, type Definition } from './collections.ts';
import { SINGLETON_NAMES, singletonSpecOf, type SingletonName, type Singletons } from './singletons.ts';

export const DEFS_ROOT = 'assets/defs';

export const collectionDir = (name: CollectionName, root = DEFS_ROOT) => join(root, specOf(name).dir);

export const idOfFile = (file: string) => basename(file, '.json');

export const jsonFilesIn = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter(file => file.endsWith('.json')) : []);

const withoutSchema = ({ $schema: _schema, ...definition }: Definition): Definition => definition;

// The menu order of a directory's ids lives in its own file, next to the directories: assets/defs/buildings -> assets/defs/order/buildings.json.
export const orderFileOf = (dir: string) => join(dirname(dir), 'order', `${basename(dir)}.json`);

export const readOrder = (dir: string): string[] => {
  const file = orderFileOf(dir);
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as string[]) : [];
};

// Node side of the game's import.meta.glob: the files of a directory, in the order of its order file.
export function readCollectionDir(dir: string): Record<string, Definition> {
  const order = readOrder(dir);
  const position = (id: string) => (order.includes(id) ? order.indexOf(id) : order.length);
  const entries = jsonFilesIn(dir).map((file): [string, Definition] => [idOfFile(file), withoutSchema(JSON.parse(readFileSync(join(dir, file), 'utf8')))]);
  return Object.fromEntries(entries.sort(([idA], [idB]) => position(idA) - position(idB) || idA.localeCompare(idB)));
}

export const readCollection = (name: CollectionName, root = DEFS_ROOT) => readCollectionDir(collectionDir(name, root));

export const singletonFileIn = (name: SingletonName, root = DEFS_ROOT) => join(root, relative(DEFS_ROOT, singletonSpecOf(name).file));

export const readSingleton = (name: SingletonName, root = DEFS_ROOT): Record<string, unknown> => withoutSchema(JSON.parse(readFileSync(singletonFileIn(name, root), 'utf8')));

export const readSingletons = (): Singletons => Object.fromEntries(SINGLETON_NAMES.map(name => [name, readSingleton(name)])) as Singletons;

export const readCollections = (root = DEFS_ROOT): Collections => Object.fromEntries(COLLECTION_NAMES.map(name => [name, readCollection(name, root)])) as Collections;
