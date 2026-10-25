import { QUATERNIUS_PACKS } from './assetPacks.ts';
import { managedModelKeys } from './managedModels.ts';
import type { ModelCatalog } from './definitionProblems.ts';
import { readModels } from './modelsFile.ts';

export type { ModelCatalog } from './definitionProblems.ts';

// The model files the game ships: the files declared by each pack and the hand-made models.
export const availableModelKeys = (): Set<string> =>
  new Set([...QUATERNIUS_PACKS.flatMap(pack => pack.files.map(file => `${pack.name}/${file}`)), ...managedModelKeys()]);

export const installablePacks = (): string[] => QUATERNIUS_PACKS.map(({ name }) => name);

export function shipsModel(): (file: string) => boolean {
  const packs = new Set(installablePacks());
  const handMade = new Set(managedModelKeys());
  return file => handMade.has(file) || packs.has(file.split('/')[0]!);
}

export const shippedModelCatalog = (): ModelCatalog => ({ models: readModels(), ships: shipsModel() });
