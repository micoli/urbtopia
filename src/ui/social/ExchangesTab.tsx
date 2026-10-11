import { isMaterial, lotReceiveIssue, type ErrorKey } from '../../core';
import type { TradeLine } from '../../core';
import type { TradeOffer } from '../../social/types';
import { useGame, useSocial, useUi } from '../common/hooks';
import { ExchangesPanel } from './exchanges/ExchangesPanel';
import type { StockLine } from './exchanges/LotLineRow';

export function ExchangesTab() {
    const state = useGame(s => s.state);
    const profile = useSocial(s => s.profile);
    const busy = useSocial(s => s.tradeBusy);
    const failure = useSocial(s => s.tradeFailure);
    const actions = useSocial(s => s.actions);
    const tradeWith = useUi(s => s.tradeWith);
    const clearTradeWith = useUi(s => s.clearTradeWith);
    const stock: StockLine[] = [...Object.entries(state.storage.materials), ...Object.entries(state.storage.goods)]
        .filter(([, quantity]) => (quantity ?? 0) > 0)
        .map(([item, quantity]) => ({item, quantity: quantity ?? 0}))
        .sort((a, b) => Number(isMaterial(b.item)) - Number(isMaterial(a.item)));
    const acceptIssueOf = (offer: TradeOffer): ErrorKey | null =>
        lotReceiveIssue(state, offer.lot, true) ?? (state.urbs < offer.price ? 'error.notEnoughUrbs' : null);
    return <ExchangesPanel profile={profile} stock={stock} initialFriendId={tradeWith} busy={busy} failure={failure} acceptIssueOf={acceptIssueOf}
        onCreate={async (to: string, lot: TradeLine[], price: number) => {
            const outcome = await actions?.createTradeOffer(to, lot, price);
            if (outcome?.ok) clearTradeWith();
            return outcome?.ok ?? false;
        }}
        onAccept={offer => void actions?.acceptTradeOffer(offer)}
        onDecline={offerId => void actions?.declineTradeOffer(offerId)}/>;
}
