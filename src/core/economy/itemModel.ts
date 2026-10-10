import { CROP_DEFINITIONS } from '../farming/crops';
import { modelFileOf } from '../models/modelFiles';
import { GOOD_ENTRIES, GOODS, MATERIAL_ENTRIES, isGood, type ItemId } from './items';

const DEFINED_MODELS = new Map<string, string>(
  [...MATERIAL_ENTRIES, ...GOOD_ENTRIES].flatMap(({ id, model }): [string, string][] => (model ? [[id, modelFileOf(model)]] : [])),
);

const CROP_PRODUCE_MODELS = new Map<string, string>(
  CROP_DEFINITIONS.flatMap(({ id, models }): [string, string][] => (models.produce ? [[id, modelFileOf(models.produce)]] : [])),
);

export const ITEM_MODEL_FILES: readonly string[] = [...DEFINED_MODELS.values()];

export function itemModelOf(item: ItemId): string | null {
  const defined = DEFINED_MODELS.get(item);
  if (defined) return defined;
  const crop = isGood(item) ? Object.keys(GOODS[item].recipe)[0] : item;
  return (crop && CROP_PRODUCE_MODELS.get(crop)) ?? null;
}
