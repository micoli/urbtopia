import { CROP_DEFINITIONS, type CropId } from '../core/farming/crops';
import { GOOD_ENTRIES, MATERIAL_ENTRIES, type BaseGoodId, type MaterialId } from '../core/economy/items';

type ItemMessageKey = `item.${MaterialId | BaseGoodId | CropId}`;

export function itemMessages(language: 'en' | 'fr'): Record<ItemMessageKey, string> {
  return Object.fromEntries([...MATERIAL_ENTRIES, ...CROP_DEFINITIONS, ...GOOD_ENTRIES].map(({ id, name }) => [`item.${id}`, name[language]])) as Record<ItemMessageKey, string>;
}
