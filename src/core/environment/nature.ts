import { NATURE_ENTRIES, tiersOf } from '../buildings/buildingDefinitions.ts';
import { modelFileOf } from '../models/modelFiles.ts';
import type { BuildingId, NatureType } from '../buildings/buildingTypes.generated.ts';
import { NATURE_FAMILIES, type NatureFamily } from './natureFamilies.ts';

export { NATURE_FAMILIES, type NatureFamily, type NatureType };

export type NatureModel = readonly [type: NatureType, model: string, family: NatureFamily, name: readonly [en: string, fr: string]];

export const NATURE_MODELS: readonly NatureModel[] = NATURE_ENTRIES.map(({ id, model, family, name }) => [id, modelFileOf(model), family, [name.en, name.fr]]);

export const NATURE_TYPES = NATURE_MODELS.map(([type]) => type);
const modelsByType = new Map<string, NatureModel>(NATURE_MODELS.map(model => [model[0], model]));

export function natureModelOf(type: string): NatureModel | undefined {
  return modelsByType.get(type);
}

export function greenProfileOf(type: string, tier = 1) {
  const tiers = tiersOf(type as BuildingId);
  if (tiers[0]?.cooling !== undefined) {
    const { radius, cooling, biodiversity, wellbeing } = tiers[tier - 1] ?? tiers[0]!;
    return { radius: radius!, cooling: cooling!, biodiversity: biodiversity!, wellbeing: wellbeing! };
  }
  const model = natureModelOf(type);
  return model ? NATURE_FAMILIES[model[2]] : undefined;
}
