import { NATURE_DEFINITIONS } from '../buildings/buildingDefinitions.ts';
import type { NatureType } from '../buildings/buildingTypes.generated';
import { NATURE_FAMILIES, type NatureFamily } from './natureFamilies.ts';

export { NATURE_FAMILIES, type NatureFamily, type NatureType };

export type NatureModel = readonly [type: NatureType, model: string, family: NatureFamily, name: readonly [en: string, fr: string]];

export const NATURE_MODELS: readonly NatureModel[] = NATURE_DEFINITIONS.map(({ model, building }) => [building.id as NatureType, model, building.family, [building.name.en, building.name.fr]]);

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
