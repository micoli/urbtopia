import { useState } from 'react';
import { t } from '../../../i18n/t';
import { TRADE_LIMITS, type TradeLine } from '../../../core';
import type { TradeFailure } from '../../../social/tradeCoordinator';
import type { Friend } from '../../../social/types';
import { ActionButton } from '../../common/ActionButton';
import { Note } from '../../common/Note';
import { LotLineRow, type StockLine } from './LotLineRow';
import { tradeFailureMessage } from './tradeFailureMessage';

interface TradeOfferFormProps {
    friends: Friend[];
    stock: StockLine[];
    initialFriendId: string | null;
    busy: boolean;
    failure: TradeFailure | null;
    onSubmit: (to: string, lot: TradeLine[], price: number) => Promise<boolean>;
}

const firstLine = (stock: StockLine[]): TradeLine[] => (stock[0] ? [{item: stock[0].item, quantity: 1}] : []);

export function TradeOfferForm({friends, stock, initialFriendId, busy, failure, onSubmit}: TradeOfferFormProps) {
    const [friendId, setFriendId] = useState(initialFriendId ?? friends[0]?.userId ?? '');
    const [lines, setLines] = useState<TradeLine[]>(() => firstLine(stock));
    const [price, setPrice] = useState(0);
    const availableOf = (item: string) => stock.find(line => line.item === item)?.quantity ?? 0;
    const freeChoices = (current: string) => stock.filter(line => line.item === current || !lines.some(used => used.item === line.item));
    const unused = stock.filter(line => !lines.some(used => used.item === line.item));
    const linesValid = lines.length > 0 && lines.every(line => Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= Math.min(availableOf(line.item), TRADE_LIMITS.maxQuantity));
    const priceValid = Number.isInteger(price) && price >= 0 && price <= TRADE_LIMITS.maxPrice;
    const canSend = !busy && friendId !== '' && linesValid && priceValid;
    const update = (index: number, change: Partial<TradeLine>) => setLines(lines.map((line, i) => (i === index ? {...line, ...change} : line)));
    return <form className="exchange-form" onSubmit={event => {
        event.preventDefault();
        if (!canSend) return;
        void onSubmit(friendId, lines, price).then(sent => {
            if (!sent) return;
            setLines(firstLine(stock));
            setPrice(0);
        });
    }}>
        <h4>{t('exchanges.new')}</h4>
        <label>
            {t('exchanges.to')}
            <select value={friendId} onChange={event => setFriendId(event.target.value)}>
                {friends.map(friend => <option key={friend.userId} value={friend.userId}>{friend.handle}</option>)}
            </select>
        </label>
        {lines.map((line, index) => <LotLineRow key={line.item} item={line.item} quantity={line.quantity} choices={freeChoices(line.item)} available={availableOf(line.item)}
            onItem={item => update(index, {item, quantity: 1})} onQuantity={quantity => update(index, {quantity})} onRemove={() => setLines(lines.filter((_, i) => i !== index))}/>)}
        <ActionButton disabled={lines.length >= TRADE_LIMITS.maxLines || unused.length === 0} onClick={() => setLines([...lines, {item: unused[0]!.item, quantity: 1}])}>{t('exchanges.addItem')}</ActionButton>
        <label>
            {t('exchanges.priceField')}
            <input type="number" inputMode="numeric" min={0} max={TRADE_LIMITS.maxPrice} value={price} onChange={event => setPrice(Number(event.target.value))}/>
        </label>
        <Note tone="muted">{t('exchanges.priceHint')}</Note>
        <ActionButton type="submit" variant="primary" disabled={!canSend}>{busy ? t('exchanges.sending') : t('exchanges.send')}</ActionButton>
        {failure ? <Note>{tradeFailureMessage(failure)}</Note> : null}
    </form>;
}
