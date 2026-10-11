import { t } from '../../../i18n/t';
import type { ErrorKey } from '../../../core';
import type { TradeOffer } from '../../../social/types';
import { ActionButton } from '../../common/ActionButton';
import { Note } from '../../common/Note';
import { AvatarImage } from '../AvatarImage';
import { LotSummary } from './LotSummary';
import { offerStatusKey } from './offerStatus';

interface OfferCardProps {
    offer: TradeOffer;
    acceptIssue: ErrorKey | null;
    busy: boolean;
    onAccept: (offer: TradeOffer) => void;
    onDecline: (offerId: string) => void;
}

export function OfferCard({offer, acceptIssue, busy, onAccept, onDecline}: OfferCardProps) {
    const mine = offer.role === 'sender';
    const price = offer.price === 0 ? t('exchanges.gift') : t('exchanges.price').replace('{P}', String(offer.price));
    const open = offer.state === 'open';
    return <li className="exchange-offer" data-state={offer.state}>
        <div className="exchange-offer-head">
            <span className="handle-label">
                <AvatarImage userId={offer.peerId} avatar={offer.peerAvatar}/>
                <strong>{t(mine ? 'exchanges.toHandle' : 'exchanges.from').replace('{H}', offer.peerHandle)}</strong>
            </span>
            <span className="exchange-price">{price}</span>
        </div>
        <LotSummary lot={offer.lot}/>
        <Note tone="muted">{t(offerStatusKey(offer)).replace('{H}', offer.peerHandle)}</Note>
        {open && !mine ? <div className="exchange-offer-actions">
            <ActionButton variant="primary" disabled={busy || acceptIssue !== null} onClick={() => onAccept(offer)}>{t('exchanges.accept')}</ActionButton>
            <ActionButton disabled={busy} onClick={() => onDecline(offer.id)}>{t('exchanges.refuse')}</ActionButton>
        </div> : null}
        {open && !mine && acceptIssue ? <Note>{t(acceptIssue)}</Note> : null}
        {open && mine ? <div className="exchange-offer-actions">
            <ActionButton disabled={busy} onClick={() => onDecline(offer.id)}>{t('exchanges.cancel')}</ActionButton>
        </div> : null}
    </li>;
}
