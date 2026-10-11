import { t } from '../../../i18n/t';
import type { MessageKey } from '../../../i18n/messages';
import type { ErrorKey } from '../../../core';
import type { TradeOffer } from '../../../social/types';
import { OfferCard } from './OfferCard';

interface OfferListProps {
    title: MessageKey;
    offers: TradeOffer[];
    acceptIssueOf: (offer: TradeOffer) => ErrorKey | null;
    busy: boolean;
    onAccept: (offer: TradeOffer) => void;
    onDecline: (offerId: string) => void;
}

export function OfferList({title, offers, acceptIssueOf, busy, onAccept, onDecline}: OfferListProps) {
    if (offers.length === 0) return null;
    return <div className="exchange-list">
        <h4>{t(title)}</h4>
        <ul>
            {offers.map(offer => <OfferCard key={offer.id} offer={offer} acceptIssue={acceptIssueOf(offer)} busy={busy} onAccept={onAccept} onDecline={onDecline}/>)}
        </ul>
    </div>;
}
