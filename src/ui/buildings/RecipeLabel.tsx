import { recipeOf, type ItemId, type MaterialId, type Storage } from '../../core';
import { isPack } from '../../i18n/itemName';
import { t } from '../../i18n/t';

interface RecipeLabelProps {
  item: ItemId;
  materials: Storage['materials'];
}

export function RecipeLabel({ item, materials }: RecipeLabelProps) {
  const parts = isPack(item) ? [] : Object.entries(recipeOf(item));
  if (parts.length === 0) return null;
  return (
    <>
      {' ('}
      {parts.map(([material, amount], index) => (
        <span key={material} className={(materials[material as MaterialId] ?? 0) < amount ? 'recipe-missing' : undefined}>
          {index > 0 ? ', ' : ''}
          {amount} {t(`item.${material as MaterialId}`)}
        </span>
      ))}
      {')'}
    </>
  );
}
