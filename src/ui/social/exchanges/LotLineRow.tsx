import { t } from '../../../i18n/t';
import { itemName } from '../../../i18n/itemName';
import type { ItemId } from '../../../core';
import { ActionButton } from '../../common/ActionButton';
import { Dropdown } from '../../common/Dropdown';
import { NumberStepper } from '../../common/NumberStepper';

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
        <Dropdown className="exchange-line-item" label={t('exchanges.item')} value={item} options={choices.map(choice => ({value: choice.item, label: itemName(choice.item as ItemId)}))} onChange={onItem}/>
        <NumberStepper label={t('exchanges.quantity')} value={quantity} min={1} max={available} onChange={onQuantity}/>
        <small>{t('exchanges.available').replace('{N}', String(available))}</small>
        <ActionButton onClick={onRemove}>{t('friends.remove')}</ActionButton>
    </div>;
}
