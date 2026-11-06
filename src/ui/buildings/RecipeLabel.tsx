import { recipeOf, type ItemId, type MaterialId, type Storage } from '../../core';
import { isPack } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { StockCount } from './StockCount';

interface RecipeLabelProps {
  item: ItemId;
  materials: Storage['materials'];
  multiplier?: number;
  showStock?: boolean;
}

export function RecipeLabel({ item, materials, multiplier = 1, showStock = false }: RecipeLabelProps) {
  const parts = isPack(item) ? [] : Object.entries(recipeOf(item)).map(([material, amount]): [string, number] => [material, amount * multiplier]);
  if (parts.length === 0) return null;
  return (
    <>
      {' ('}
      {parts.map(([material, amount], index) => (
        <span key={material} className={(materials[material as MaterialId] ?? 0) < amount ? 'recipe-missing' : undefined}>
          {index > 0 ? ', ' : ''}
          {showStock ? <><StockCount>{materials[material as MaterialId] ?? 0}</StockCount>/</> : null}{amount} {t(`item.${material as MaterialId}`)}
        </span>
      ))}
      {')'}
    </>
  );
}
