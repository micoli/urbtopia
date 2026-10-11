import { t } from '../../../i18n/t';
import type { ErrorKey, TradeLine } from '../../../core';
import type { TradeFailure } from '../../../social/tradeCoordinator';
import type { SocialState, TradeOffer } from '../../../social/types';
import { Note } from '../../common/Note';
import type { StockLine } from './LotLineRow';
import { OfferList } from './OfferList';
import { TradeOfferForm } from './TradeOfferForm';
import { offerGroup } from './offerStatus';

interface ExchangesPanelProps {
    profile: SocialState | null;
    stock: StockLine[];
    initialFriendId: string | null;
    busy: boolean;
    failure: TradeFailure | null;
    acceptIssueOf: (offer: TradeOffer) => ErrorKey | null;
    onCreate: (to: string, lot: TradeLine[], price: number) => Promise<boolean>;
    onAccept: (offer: TradeOffer) => void;
    onDecline: (offerId: string) => void;
}

export function ExchangesPanel({profile, stock, initialFriendId, busy, failure, acceptIssueOf, onCreate, onAccept, onDecline}: ExchangesPanelProps) {
    if (!profile) return <p>{t('exchanges.locked')}</p>;
    const groups = (group: ReturnType<typeof offerGroup>) => profile.offers.filter(offer => offerGroup(offer) === group);
    const received = groups('received');
    const sent = groups('sent');
    const progress = groups('progress');
    const nothing = received.length + sent.length + progress.length === 0;
    const list = {acceptIssueOf, busy, onAccept, onDecline};
    return <>
        {profile.friends.length === 0 ? <Note tone="muted">{t('exchanges.noFriends')}</Note>
            : stock.length === 0 ? <Note tone="muted">{t('exchanges.noStock')}</Note>
            : <TradeOfferForm key={`${initialFriendId}:${stock.length}`} friends={profile.friends} stock={stock} initialFriendId={initialFriendId} busy={busy} failure={failure} onSubmit={onCreate}/>}
        <OfferList title="exchanges.received" offers={received} {...list}/>
        <OfferList title="exchanges.sent" offers={sent} {...list}/>
        <OfferList title="exchanges.inProgress" offers={progress} {...list}/>
        {nothing ? <p className="note note--muted">{t('exchanges.none')}</p> : null}
    </>;
}
