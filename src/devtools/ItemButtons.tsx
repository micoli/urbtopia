import { type ItemId } from '../core';
import { itemName } from '../i18n/itemName';

interface ItemButtonsProps {
  title: string;
  items: ItemId[];
  filter: string;
  disabled: boolean;
  onGive: (item: ItemId) => void;
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function ItemButtons({ title, items, filter, disabled, onGive }: ItemButtonsProps) {
  const visible = items.filter((item) => normalize(itemName(item)).includes(normalize(filter)));
  if (visible.length === 0) return null;
  return (
    <fieldset className="devtools-items">
      <legend>{title}</legend>
      {visible.map((item) => (
        <button key={item} type="button" disabled={disabled} onClick={() => onGive(item)}>{itemName(item)}</button>
      ))}
    </fieldset>
  );
}
