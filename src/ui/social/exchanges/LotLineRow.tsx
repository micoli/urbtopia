import { t } from '../../../i18n/t';
import { itemName } from '../../../i18n/itemName';
import type { ItemId } from '../../../core';
import { ActionButton } from '../../common/ActionButton';

export interface StockLine {
    item: string;
    quantity: number;
}

interface LotLineRowProps {
    item: string;
    quantity: number;
    choices: StockLine[];
    available: number;
    onItem: (item: string) => void;
    onQuantity: (quantity: number) => void;
    onRemove: () => void;
}

export function LotLineRow({item, quantity, choices, available, onItem, onQuantity, onRemove}: LotLineRowProps) {
    return <div className="exchange-line">
        <select aria-label={t('exchanges.item')} value={item} onChange={event => onItem(event.target.value)}>
            {choices.map(choice => <option key={choice.item} value={choice.item}>{itemName(choice.item as ItemId)}</option>)}
        </select>
        <input type="number" inputMode="numeric" min={1} max={available} aria-label={t('exchanges.quantity')} value={quantity}
               onChange={event => onQuantity(Number(event.target.value))}/>
        <small>{t('exchanges.available').replace('{N}', String(available))}</small>
        <ActionButton onClick={onRemove}>{t('friends.remove')}</ActionButton>
    </div>;
}
