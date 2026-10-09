import { readBuildings, writeBuildings } from './buildingsFile.ts';

// Rewrites the definition files in their stable form and regenerates the id unions and the JSON Schemas, after a hand edit or a schema change.
writeBuildings(readBuildings());
