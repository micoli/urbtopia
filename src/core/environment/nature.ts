import { NATURE_ENTRIES } from '../buildings/buildingDefinitions.ts';
import type { NatureType } from '../buildings/buildingTypes.generated.ts';
import { NATURE_FAMILIES, type NatureFamily } from './natureFamilies.ts';

export { NATURE_FAMILIES, type NatureFamily, type NatureType };

export type NatureModel = readonly [type: NatureType, model: string, family: NatureFamily, name: readonly [en: string, fr: string]];

export const NATURE_MODELS: readonly NatureModel[] = NATURE_ENTRIES.map(({ id, model, nature, name }) => [id, model, nature.family, [name.en, name.fr]]);

export const NATURE_TYPES = NATURE_MODELS.map(([type]) => type);
const modelsByType = new Map<string, NatureModel>(NATURE_MODELS.map(model => [model[0], model]));

export function natureModelOf(type: string): NatureModel | undefined {
  return modelsByType.get(type);
}

export function greenProfileOf(type: string) {
  if (type === 'tree') return { radius: 4, cooling: 1, biodiversity: 1, wellbeing: 1 };
  if (type === 'park') return { radius: 6, cooling: 3, biodiversity: 3, wellbeing: 3 };
  const model = natureModelOf(type);
  return model ? NATURE_FAMILIES[model[2]] : undefined;
}
