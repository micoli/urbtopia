import { findLedgerEntry, isShipmentLedgerId, isValidLot, lotReceiveIssue, pendingTradeEntries, TRADE_LIMITS, type Command, type ErrorKey, type GameState, type TradeEffect, type TradeLedgerEntry, type TradeLine } from '../core';
import { SocialError, type SocialClient, type SocialErrorKind, type TradeOffer, type TradeSlot } from './types';

// The game side the coordinator needs: read the state, apply a command (null when it worked), write the save.
export interface TradeGame {
  state: () => GameState;
  apply: (command: Command) => ErrorKey | null;
  persist: () => void;
  canTrade: () => boolean;
}

export type TradeFailure =
  | { kind: 'game'; key: ErrorKey }
  | { kind: 'social'; error: SocialErrorKind; retryAfterSeconds: number | null }
  | { kind: 'read-only' };

// `pending` means the effect stays in the ledger and is replayed until the server answers.
export type TradeOutcome = { ok: true; offerId: string | null } | { ok: false; failure: TradeFailure; pending: boolean };

export interface TradeDeps {
  client: SocialClient;
  game: TradeGame;
  newId: () => string;
}

const CREATE_REFUSALS: ReadonlySet<SocialErrorKind> = new Set(['trade-invalid', 'trade-conflict', 'trade-unavailable', 'not-friends', 'cap-trades-open', 'rate-limited', 'not-found']);
const CLAIM_EFFECTS: ReadonlySet<TradeEffect> = new Set(['receive-lot', 'receive-payment', 'return-lot', 'return-payment']);

function claimEffect(slot: TradeSlot, offer: TradeOffer): TradeEffect {
  if (slot === 'lot') return offer.state === 'accepted' ? 'receive-lot' : 'return-lot';
  return offer.state === 'accepted' ? 'receive-payment' : 'return-payment';
}

function socialFailure(error: unknown): TradeFailure {
  const failure = error instanceof SocialError ? error : new SocialError('unknown');
  return { kind: 'social', error: failure.kind, retryAfterSeconds: failure.retryAfterSeconds };
}

function kindOf(error: unknown): SocialErrorKind {
  return error instanceof SocialError ? error.kind : 'unknown';
}

// Runs every trade step as: apply the effect to the save, write the save, call the server, confirm (ADR 0028).
// Steps are serialised, and anything unfinished is replayed by `reconcile` until the server and the ledger agree.
export class TradeCoordinator {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private deps: TradeDeps) {}

  createOffer(to: string, lot: TradeLine[], price: number): Promise<TradeOutcome> {
    return this.serial(async () => {
      const { game } = this.deps;
      if (!game.canTrade()) return { ok: false, failure: { kind: 'read-only' }, pending: false };
      if (!isValidLot(lot)) return this.refused('error.invalidTradeLot');
      if (!Number.isInteger(price) || price < 0 || price > TRADE_LIMITS.maxPrice) return this.refused('error.invalidPrice');
      const offerId = this.deps.newId();
      const key = game.apply({ type: 'TradeApply', offerId, effect: 'reserve-lot', lot, urbs: price, peer: to });
      if (key) return this.refused(key);
      game.persist();
      return this.sendCreate(offerId, to, lot, price);
    });
  }

  acceptOffer(offer: TradeOffer): Promise<TradeOutcome> {
    return this.serial(async () => {
      const { game, client } = this.deps;
      if (!game.canTrade()) return { ok: false, failure: { kind: 'read-only' }, pending: false };
      const key = game.apply({ type: 'TradeApply', offerId: offer.id, effect: 'pay', lot: offer.lot, urbs: offer.price, peer: offer.peerId });
      if (key) return this.refused(key);
      game.persist();
      try {
        await client.acceptTradeOffer(offer.id);
      } catch (error) {
        if (kindOf(error) === 'trade-unavailable') {
          this.rollback(offer.id, 'pay');
          return { ok: false, failure: socialFailure(error), pending: false };
        }
        return { ok: false, failure: socialFailure(error), pending: true };
      }
      this.confirm(offer.id, 'pay');
      return { ok: true, offerId: offer.id };
    });
  }

  declineOffer(offerId: string): Promise<TradeOutcome> {
    return this.serial(async () => {
      try {
        await this.deps.client.declineTradeOffer(offerId);
        return { ok: true, offerId };
      } catch (error) {
        return { ok: false, failure: socialFailure(error), pending: false };
      }
    });
  }

  // Replays the unfinished steps of the ledger, then claims what the server holds for this player.
  reconcile(offers: readonly TradeOffer[]): Promise<void> {
    return this.serial(async () => {
      if (!this.deps.game.canTrade()) return;
      await this.replayPending(offers);
      for (const offer of offers) await this.claimOwnedSlots(offer);
    });
  }

  private serial<T>(step: () => Promise<T>): Promise<T> {
    const run = this.queue.then(step, step);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private refused(key: ErrorKey): TradeOutcome {
    return { ok: false, failure: { kind: 'game', key }, pending: false };
  }

  private async sendCreate(offerId: string, to: string, lot: TradeLine[], price: number): Promise<TradeOutcome> {
    try {
      await this.deps.client.createTradeOffer(offerId, to, lot, price);
    } catch (error) {
      if (CREATE_REFUSALS.has(kindOf(error))) {
        this.rollback(offerId, 'reserve-lot');
        return { ok: false, failure: socialFailure(error), pending: false };
      }
      return { ok: false, failure: socialFailure(error), pending: true };
    }
    this.confirm(offerId, 'reserve-lot');
    return { ok: true, offerId };
  }

  private confirm(offerId: string, effect: TradeEffect): void {
    this.deps.game.apply({ type: 'TradeConfirm', offerId, effect });
    this.deps.game.persist();
  }

  private rollback(offerId: string, effect: TradeEffect): void {
    this.deps.game.apply({ type: 'TradeRollback', offerId, effect });
    this.deps.game.persist();
  }

  private async replayPending(offers: readonly TradeOffer[]): Promise<void> {
    for (const entry of pendingTradeEntries(this.deps.game.state())) {
      if (isShipmentLedgerId(entry.offerId)) continue;
      if (CLAIM_EFFECTS.has(entry.effect)) {
        this.confirm(entry.offerId, entry.effect);
        continue;
      }
      if (entry.effect === 'reserve-lot') await this.replayCreate(entry);
      else if (entry.effect === 'pay') await this.replayAccept(entry, offers);
    }
  }

  private async replayCreate(entry: TradeLedgerEntry): Promise<void> {
    if (!entry.peer || !entry.lot || entry.urbs === undefined) return this.rollback(entry.offerId, 'reserve-lot');
    try {
      await this.deps.client.createTradeOffer(entry.offerId, entry.peer, entry.lot, entry.urbs);
    } catch (error) {
      if (CREATE_REFUSALS.has(kindOf(error))) this.rollback(entry.offerId, 'reserve-lot');
      return;
    }
    this.confirm(entry.offerId, 'reserve-lot');
  }

  // A refusal to accept again may only mean the first try went through and the offer moved on:
  // the offer listed as accepted or lapsed proves the payment was taken, so it is confirmed, never refunded.
  private async replayAccept(entry: TradeLedgerEntry, offers: readonly TradeOffer[]): Promise<void> {
    try {
      await this.deps.client.acceptTradeOffer(entry.offerId);
    } catch (error) {
      if (kindOf(error) !== 'trade-unavailable') return;
      const seen = offers.find((offer) => offer.id === entry.offerId);
      if (seen && (seen.state === 'accepted' || seen.state === 'lapsed')) return this.confirm(entry.offerId, 'pay');
      return this.rollback(entry.offerId, 'pay');
    }
    this.confirm(entry.offerId, 'pay');
  }

  private async claimOwnedSlots(offer: TradeOffer): Promise<void> {
    for (const slot of new Set<TradeSlot>([...offer.claimable, ...offer.claimed])) {
      const effect = claimEffect(slot, offer);
      if (findLedgerEntry(this.deps.game.state(), offer.id, effect)) continue;
      if ((effect === 'receive-lot' || effect === 'return-lot') && lotReceiveIssue(this.deps.game.state(), offer.lot, false)) continue;
      await this.claim(offer, slot, effect);
    }
  }

  private async claim(offer: TradeOffer, slot: TradeSlot, effect: TradeEffect): Promise<void> {
    const { game, client } = this.deps;
    let claimed;
    try {
      claimed = await client.claimTrade(offer.id, slot);
    } catch {
      return;
    }
    if (claimed.effect !== effect) return;
    const key = game.apply({ type: 'TradeApply', offerId: offer.id, effect, lot: claimed.lot, urbs: claimed.urbs });
    if (key) return;
    game.persist();
    this.confirm(offer.id, effect);
  }
}
