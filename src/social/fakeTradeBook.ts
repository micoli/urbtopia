import { isValidLot, TRADE_LIMITS, type TradeEffect, type TradeLine } from '../core';
import { SocialError, type TradeClaim, type TradeOffer, type TradeOfferState, type TradeSlot } from './types';

const HOUR_MS = 3_600_000;
const OPEN_WINDOW_MS = 72 * HOUR_MS;
const CLAIM_WINDOW_MS = 72 * HOUR_MS;
const DAY_MS = 24 * HOUR_MS;
const MAX_OPEN_OFFERS = 5;
const MAX_OFFERS_PER_DAY = 30;

interface StoredOffer {
  id: string;
  senderId: string;
  recipientId: string;
  lot: TradeLine[];
  price: number;
  state: TradeOfferState;
  createdAt: number;
  expiresAt: number;
  claimDeadline: number | null;
  lotClaimed: boolean;
  paymentClaimed: boolean;
}

interface Hooks {
  clock: () => number;
  bump: (...userIds: string[]) => void;
  areFriends: (a: string, b: string) => boolean;
  handleOf: (userId: string) => string;
}

const RETURNED: readonly TradeOfferState[] = ['refused', 'cancelled', 'expired', 'lapsed'];

// In-memory twin of the server's Trade offers: Escrow lifecycle, single claims, limits and expiry, driven by the injected clock.
export class FakeTradeBook {
  private offers: StoredOffer[] = [];

  constructor(private hooks: Hooks) {}

  create(senderId: string, id: string, to: string, lot: TradeLine[], price: number): void {
    if (!id || !isValidLot(lot) || !Number.isInteger(price) || price < 0 || price > TRADE_LIMITS.maxPrice) throw new SocialError('trade-invalid');
    const existing = this.offers.find((offer) => offer.id === id);
    if (existing) {
      const same = existing.senderId === senderId && existing.recipientId === to && existing.price === price && JSON.stringify(existing.lot) === JSON.stringify(lot);
      if (!same) throw new SocialError('trade-conflict');
      return;
    }
    if (to === senderId) throw new SocialError('trade-invalid');
    if (!this.hooks.areFriends(senderId, to)) throw new SocialError('not-friends');
    const now = this.hooks.clock();
    this.settleAll(senderId);
    const mine = this.offers.filter((offer) => offer.senderId === senderId);
    if (mine.filter((offer) => offer.state === 'open').length >= MAX_OPEN_OFFERS) throw new SocialError('cap-trades-open');
    const lastDay = mine.filter((offer) => offer.createdAt > now - DAY_MS);
    if (lastDay.length >= MAX_OFFERS_PER_DAY) {
      throw new SocialError('rate-limited', Math.max(1, Math.ceil((Math.min(...lastDay.map((offer) => offer.createdAt)) + DAY_MS - now) / 1000)));
    }
    this.offers.push({
      id, senderId, recipientId: to, lot: lot.map((line) => ({ ...line })), price, state: 'open', createdAt: now, expiresAt: now + OPEN_WINDOW_MS,
      claimDeadline: null, lotClaimed: false, paymentClaimed: false,
    });
    this.hooks.bump(senderId, to);
  }

  accept(userId: string, id: string): void {
    const offer = this.find(id);
    if (offer.recipientId !== userId || offer.state !== 'open') throw new SocialError('trade-unavailable');
    offer.state = 'accepted';
    offer.claimDeadline = this.hooks.clock() + CLAIM_WINDOW_MS;
    this.hooks.bump(offer.senderId, offer.recipientId);
  }

  decline(userId: string, id: string): void {
    const offer = this.find(id);
    if (offer.state !== 'open' || (offer.senderId !== userId && offer.recipientId !== userId)) throw new SocialError('trade-unavailable');
    offer.state = offer.recipientId === userId ? 'refused' : 'cancelled';
    this.hooks.bump(offer.senderId, offer.recipientId);
  }

  claim(userId: string, id: string, slot: TradeSlot): TradeClaim {
    const offer = this.find(id);
    const isLot = slot === 'lot';
    const owner = isLot
      ? offer.state === 'accepted' ? offer.recipientId : RETURNED.includes(offer.state) ? offer.senderId : null
      : offer.state === 'accepted' && offer.lotClaimed ? offer.senderId : offer.state === 'lapsed' ? offer.recipientId : null;
    if (owner !== userId) throw new SocialError('trade-unavailable');
    const already = isLot ? offer.lotClaimed : offer.paymentClaimed;
    if (!already) {
      if (isLot) offer.lotClaimed = true;
      else offer.paymentClaimed = true;
      this.hooks.bump(offer.senderId, offer.recipientId);
    }
    const effect: TradeEffect = isLot ? (offer.state === 'accepted' ? 'receive-lot' : 'return-lot') : offer.state === 'accepted' ? 'receive-payment' : 'return-payment';
    return isLot
      ? { offerId: id, slot, effect, alreadyClaimed: already, lot: offer.lot.map((line) => ({ ...line })) }
      : { offerId: id, slot, effect, alreadyClaimed: already, urbs: offer.price };
  }

  // A Friendship that ends, or a Block, closes every offer between the two.
  closeBetween(a: string, b: string): void {
    for (const offer of this.offers) {
      const between = (offer.senderId === a && offer.recipientId === b) || (offer.senderId === b && offer.recipientId === a);
      if (!between) continue;
      if (offer.state === 'open') offer.state = 'cancelled';
      else if (offer.state === 'accepted' && !offer.lotClaimed) offer.state = 'lapsed';
      else continue;
      this.hooks.bump(offer.senderId, offer.recipientId);
    }
  }

  listFor(userId: string): TradeOffer[] {
    this.settleAll(userId);
    return this.offers
      .filter((offer) => (offer.senderId === userId || offer.recipientId === userId) && this.isListed(offer, userId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((offer) => {
        const peerId = offer.senderId === userId ? offer.recipientId : offer.senderId;
        return {
          id: offer.id, role: offer.senderId === userId ? 'sender' : 'recipient', peerId, peerHandle: this.hooks.handleOf(peerId),
          lot: offer.lot.map((line) => ({ ...line })), price: offer.price, state: offer.state, createdAt: offer.createdAt, expiresAt: offer.expiresAt,
          claimDeadline: offer.claimDeadline, claimable: this.claimable(offer, userId),
        };
      });
  }

  private claimable(offer: StoredOffer, userId: string): TradeSlot[] {
    const slots: TradeSlot[] = [];
    const lotOwner = offer.state === 'accepted' ? offer.recipientId : RETURNED.includes(offer.state) ? offer.senderId : null;
    if (!offer.lotClaimed && lotOwner === userId) slots.push('lot');
    const paymentOwner = offer.state === 'accepted' && offer.lotClaimed ? offer.senderId : offer.state === 'lapsed' ? offer.recipientId : null;
    if (!offer.paymentClaimed && paymentOwner === userId) slots.push('payment');
    return slots;
  }

  private isListed(offer: StoredOffer, userId: string): boolean {
    if (offer.state === 'open') return true;
    if (offer.state === 'accepted' && !offer.lotClaimed) return true;
    return this.claimable(offer, userId).length > 0;
  }

  private settleAll(userId: string): void {
    const now = this.hooks.clock();
    for (const offer of this.offers) {
      if (offer.senderId !== userId && offer.recipientId !== userId) continue;
      if (offer.state === 'open' && offer.expiresAt <= now) offer.state = 'expired';
      else if (offer.state === 'accepted' && !offer.lotClaimed && offer.claimDeadline !== null && offer.claimDeadline <= now) offer.state = 'lapsed';
      else continue;
      this.hooks.bump(offer.senderId, offer.recipientId);
    }
  }

  private find(id: string): StoredOffer {
    this.settleAll(this.offers.find((offer) => offer.id === id)?.senderId ?? '');
    const offer = this.offers.find((candidate) => candidate.id === id);
    if (!offer) throw new SocialError('trade-unavailable');
    return offer;
  }
}
