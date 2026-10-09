import { ASSET_PACKS, QUATERNIUS_PACKS } from './assetPacks.ts';
import { managedModelKeys, polyPizzaModelKeys } from './managedModels.ts';

// The models the game ships: the files declared by each pack, hand-made models and Poly Pizza models.
export const availableModelKeys = (): Set<string> =>
  new Set([...[...ASSET_PACKS, ...QUATERNIUS_PACKS].flatMap(pack => pack.files.map(file => `${pack.name}/${file}`)), ...managedModelKeys(), ...polyPizzaModelKeys()]);

export const modelReferenceProblems = (definitions: Record<string, { model: string }>, models: ReadonlySet<string>): string[] =>
  Object.entries(definitions).filter(([, { model }]) => !models.has(model)).map(([id, { model }]) => `${id}: unknown model ${model}`);
