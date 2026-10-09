import { ASSET_PACKS, QUATERNIUS_PACKS } from './assetPacks.ts';
import { managedModelKeys, polyPizzaModelKeys } from './managedModels.ts';
import { readModels, type ModelDefinitions } from './modelsFile.ts';

// The model files the game ships: the files declared by each pack, hand-made models and Poly Pizza models.
export const availableModelKeys = (): Set<string> =>
  new Set([...[...ASSET_PACKS, ...QUATERNIUS_PACKS].flatMap(pack => pack.files.map(file => `${pack.name}/${file}`)), ...managedModelKeys(), ...polyPizzaModelKeys()]);

export interface ModelCatalog {
  models: ModelDefinitions;
  files: ReadonlySet<string>;
}

export const shippedModelCatalog = (): ModelCatalog => ({ models: readModels(), files: availableModelKeys() });

export const modelReferenceProblems = (definitions: Record<string, { model: string }>, { models, files }: ModelCatalog): string[] =>
  Object.entries(definitions).flatMap(([id, { model }]) => {
    const file = models[model]?.file;
    if (!file) return [`${id}: unknown Model id ${model}`];
    return files.has(file) ? [] : [`${id}: model ${model} has no shipped file ${file}`];
  });
