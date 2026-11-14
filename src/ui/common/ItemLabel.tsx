import type { ReactNode } from 'react';
import type { ItemId } from '../../core';
import { itemName } from '../../i18n/itemName';
import { ItemIcon } from './ItemIcon';

interface ItemLabelProps {
  item: ItemId;
  children?: ReactNode;
}

export function ItemLabel({ item, children }: ItemLabelProps) {
  return (
    <span className="item-label">
      <ItemIcon item={item} />
      <span>{children ?? itemName(item)}</span>
    </span>
  );
}
