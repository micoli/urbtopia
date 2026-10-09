import type { BuildingDefinitions } from '../src/core/buildings/buildingDefinition.ts';
import type { ModelDefinition } from '../src/scene/modelDefinitions.ts';
import { QUATERNIUS_PACKS } from './assetPacks.ts';
import { readBuildings, writeBuildings } from './buildingsFile.ts';
import { managedModelKeys } from './managedModels.ts';
import { idByFile, modelIdOf, readModels, writeModels, type ModelDefinitions } from './modelsFile.ts';

// The current assets editor still names models by file: these views translate to and from Model ids until it works with them.

export const modelsByFile = (models = readModels()): Record<string, ModelDefinition> =>
  Object.fromEntries(Object.values(models).map(({ file, ...settings }) => [file, settings]));

const referencedIds = (buildings: BuildingDefinitions) => new Set(Object.values(buildings).map(({ model }) => model));

export function writeModelsByFile(view: Record<string, ModelDefinition>): void {
  const ids = idByFile(readModels());
  const models: ModelDefinitions = Object.fromEntries(Object.entries(view).map(([file, settings]) => [ids.get(file) ?? modelIdOf(file), { file, ...settings }]));
  const lost = [...referencedIds(readBuildings())].filter(id => !models[id]);
  if (lost.length) throw new Error(`Models used by buildings cannot be removed: ${lost.join(', ')}`);
  writeModels(models);
}

export const buildingsByModelFile = (): BuildingDefinitions => {
  const models = readModels();
  return Object.fromEntries(Object.entries(readBuildings()).map(([id, building]) => [id, { ...building, model: models[building.model]?.file ?? building.model }]));
};

const QUATERNIUS = new Set(QUATERNIUS_PACKS.map(({ name }) => name));

// Kenney and Quaternius models are CC0, so a building can use one before it has a definition; other sources are defined when added.
function definitionFor(file: string): ModelDefinitions[string] {
  const pack = file.split('/')[0]!;
  if (pack === 'poly.pizza' || managedModelKeys().includes(file)) throw new Error(`Define ${file} before using it in a building`);
  return { file, source: QUATERNIUS.has(pack) ? 'quaternius' : 'kenney', license: 'CC0' };
}

export function writeBuildingsByModelFile(view: BuildingDefinitions): void {
  const models = readModels();
  const ids = idByFile(models);
  const added: ModelDefinitions = {};
  const buildings = Object.fromEntries(Object.entries(view).map(([id, building]) => {
    const known = ids.get(building.model);
    if (known) return [id, { ...building, model: known }];
    const modelId = modelIdOf(building.model);
    added[modelId] ??= definitionFor(building.model);
    return [id, { ...building, model: modelId }];
  }));
  if (Object.keys(added).length) writeModels({ ...models, ...added });
  writeBuildings(buildings);
}
