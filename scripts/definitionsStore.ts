import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { writeCollection, writeSingleton } from './collectionFiles.ts';
import { collectionDir, readCollections, readSingletons } from './collectionRead.ts';
import { COLLECTION_NAMES, type CollectionName, type Collections } from './collections.ts';
import { allCollectionProblems, allModelProblems, allSingletonProblems, describeProblem, type ModelDefinitions } from './definitionProblems.ts';
import { installablePacks, shipsModel } from './modelReferences.ts';
import { readModels, writeModels } from './modelsFile.ts';
import { SINGLETON_NAMES, type Singletons } from './singletons.ts';

export const SAVE_FIXTURES_DIR = 'src/persistence/fixtures';

export interface Definitions {
  models: ModelDefinitions;
  collections: Collections;
  singletons: Singletons;
}

export interface Catalog extends Definitions {
  installablePacks: string[];
}

export const readCatalog = (): Catalog => ({ models: readModels(), collections: readCollections(), singletons: readSingletons(), installablePacks: installablePacks() });

// Everything is checked together before anything is written, so a save never leaves a reference to a missing definition.
export function saveDefinitions({ models, collections, singletons }: Definitions): void {
  const catalog = { models, ships: shipsModel() };
  const problems = [
    ...allModelProblems(models).map(describeProblem),
    ...allCollectionProblems(collections, catalog).map(problem => `${problem.collection}/${describeProblem(problem)}`),
    ...allSingletonProblems(singletons, { collections, catalog }).map(describeProblem),
  ];
  if (problems.length) throw new Error(problems.join('\n'));
  writeModels(models);
  for (const name of COLLECTION_NAMES) writeCollection(name, collections[name]);
  for (const name of SINGLETON_NAMES) writeSingleton(name, singletons[name]);
}

const savesHolding = (id: string, fixtures: string): string[] => {
  if (!existsSync(fixtures)) return [];
  return readdirSync(fixtures).filter(file => file.endsWith('.json') && readFileSync(join(fixtures, file), 'utf8').includes(`"${id}"`));
};

// A Game object id lives in saves: it is removed for real only when no save fixture mentions it; otherwise it is retired.
export function deleteDefinition(collection: CollectionName, id: string, paths = { dir: collectionDir(collection), fixtures: SAVE_FIXTURES_DIR }): void {
  const file = join(paths.dir, `${id}.json`);
  if (!existsSync(file)) throw new Error(`Unknown ${collection} id ${id}`);
  const saves = savesHolding(id, paths.fixtures);
  if (saves.length) throw new Error(`${id} is in saves (${saves.join(', ')}): retire it instead`);
  rmSync(file);
}
