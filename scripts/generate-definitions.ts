import { writeCollection, writeSingleton } from './collectionFiles.ts';
import { readCollection, readSingleton } from './collectionRead.ts';
import { COLLECTION_NAMES } from './collections.ts';
import { readModels, writeModels } from './modelsFile.ts';
import { SINGLETON_NAMES } from './singletons.ts';

// Rewrites the definition files in their stable form and regenerates the id unions and the JSON Schemas, after a hand edit or a schema change.
writeModels(readModels());
for (const name of COLLECTION_NAMES) writeCollection(name, readCollection(name));
for (const name of SINGLETON_NAMES) writeSingleton(name, readSingleton(name));
