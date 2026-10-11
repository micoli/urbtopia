import type { MessageKey } from '../../../i18n/messages';
import type { TradeOffer } from '../../../social/types';

export type OfferGroup = 'received' | 'sent' | 'progress' | 'finished';

// An offer is finished for this player once nothing is left to wait for or to claim.
export function offerGroup(offer: TradeOffer): OfferGroup {
  if (offer.state === 'open') return offer.role === 'recipient' ? 'received' : 'sent';
  if (offer.claimable.length > 0) return 'progress';
  if (offer.state === 'accepted') {
    const done = offer.role === 'recipient' ? offer.claimed.includes('lot') : offer.claimed.includes('payment');
    return done ? 'finished' : 'progress';
  }
  const owed = offer.role === 'sender' ? 'lot' : offer.state === 'lapsed' ? 'payment' : null;
  return owed === null || offer.claimed.includes(owed) ? 'finished' : 'progress';
}

export function offerStatusKey(offer: TradeOffer): MessageKey {
  if (offer.state === 'open') return offer.role === 'recipient' ? 'exchanges.status.open-recipient' : 'exchanges.status.open-sender';
  if (offer.state === 'accepted') return offer.role === 'recipient' ? 'exchanges.status.accepted-recipient' : 'exchanges.status.accepted-sender';
  return offer.role === 'sender' ? 'exchanges.status.returning-sender' : 'exchanges.status.returning-recipient';
}
