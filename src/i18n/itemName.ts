import { PACK_FORMATS, isGood, recipeOf, type PackId, type ItemId } from '../core';
import { t } from './t';

function packSuffixOf(item: ItemId): (typeof PACK_FORMATS)[number]['suffix'] | undefined {
  if (!isGood(item)) return undefined;
  return PACK_FORMATS.find(({ suffix }) => item.endsWith(suffix))?.suffix;
}

export function isPack(item: ItemId): item is PackId {
  return packSuffixOf(item) !== undefined;
}

export function itemName(item: ItemId): string {
  const suffix = packSuffixOf(item);
  if (!suffix) return t(`item.${item as Exclude<ItemId, PackId>}`);
  const [crop, count] = Object.entries(recipeOf(item))[0] ?? [];
  if (!crop) return item;
  const cropName = t(`item.${crop as Exclude<ItemId, PackId>}`);
  return t(`pack.${suffix}`)
    .replace('{count}', String(count))
    .replace('{crop}', cropName.charAt(0).toLowerCase() + cropName.slice(1));
}
