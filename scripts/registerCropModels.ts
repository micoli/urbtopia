import { readFileSync, writeFileSync } from 'node:fs';

// Usage: node scripts/registerCropModels.ts <species> <suffix>... — e.g. `wheat 1 2 3 4 crop`.
// Points the existing Model ids `crops-<species>-<suffix>` at our own models in assets/managed-models/crops/.
const [species, ...suffixes] = process.argv.slice(2);
const FILE = 'assets/models.json';
const models = JSON.parse(readFileSync(FILE, 'utf8'));

for (const suffix of suffixes) {
  const id = `crops-${species}-${suffix}`;
  if (!models[id]) throw new Error(`${id} is not a known Model id`);
  models[id] = { file: `crops/${species}-${suffix}`, source: 'managed', license: 'Own work' };
}

writeFileSync(FILE, `${JSON.stringify(models, null, 2)}\n`);
