import { findLedgerEntry, isShipmentLedgerId, isValidLot, lotReceiveIssue, pendingTradeEntries, shipmentLedgerId, type Command, type ErrorKey, type GameState, type TradeEffect, type TradeLine } from '../core';
import { ShipmentError, type Shipment, type ShipmentClient, type ShipmentErrorKind } from './types';

// The game side the coordinator needs: read the state, apply a command (null when it worked), write the save.
export interface ShipmentGame {
  state: () => GameState;
  apply: (command: Command) => ErrorKey | null;
  persist: () => void;
  canPlay: () => boolean;
}

export type ShipmentFailure =
  | { kind: 'game'; key: ErrorKey }
  | { kind: 'shipment'; error: ShipmentErrorKind; retryAfterSeconds: number | null }
  | { kind: 'read-only' };

// `pending` means the effect stays in the ledger and is replayed until the server answers.
export type ShipmentOutcome = { ok: true; shipmentId: string } | { ok: false; failure: ShipmentFailure; pending: boolean };

export interface ShipmentDeps {
  client: ShipmentClient;
  game: ShipmentGame;
  newId: () => string;
}

export interface ReconcileReport {
  // Shipments for this City that stay waiting because their Lot does not fit the Storehouse yet.
  waitingForRoom: string[];
}

const SEND_REFUSALS: ReadonlySet<ShipmentErrorKind> = new Set(['shipment-invalid', 'shipment-conflict', 'shipment-unavailable', 'city-unknown', 'cap-shipments-waiting', 'rate-limited']);
const APPLIED_EFFECTS: ReadonlySet<TradeEffect> = new Set(['receive-lot', 'return-lot']);

function failureOf(error: unknown): ShipmentFailure {
  const failure = error instanceof ShipmentError ? error : new ShipmentError('unknown');
  return { kind: 'shipment', error: failure.kind, retryAfterSeconds: failure.retryAfterSeconds };
}

function kindOf(error: unknown): ShipmentErrorKind {
  return error instanceof ShipmentError ? error.kind : 'unknown';
}

// Runs every Shipment step as: apply the effect to the save, write the save, call the server, confirm (ADR 0028 and 0048).
// Steps are serialised, and anything unfinished is replayed by `reconcile` until the server and the ledger agree.
export class ShipmentCoordinator {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private deps: ShipmentDeps) {}

  send(toCityId: string, lot: TradeLine[]): Promise<ShipmentOutcome> {
    return this.serial(async () => {
      const { game } = this.deps;
      if (!game.canPlay()) return { ok: false, failure: { kind: 'read-only' }, pending: false };
      if (!isValidLot(lot)) return this.refused('error.invalidTradeLot');
      const shipmentId = this.deps.newId();
      const key = game.apply({ type: 'TradeApply', offerId: shipmentLedgerId(shipmentId), effect: 'reserve-lot', lot, peer: toCityId });
      if (key) return this.refused(key);
      game.persist();
      return this.sendCreate(shipmentId, toCityId, lot);
    });
  }

  // The sending City takes its Lot back; the credit is applied once the server confirmed the cancellation.
  cancel(shipmentId: string): Promise<ShipmentOutcome> {
    return this.serial(async () => {
      if (!this.deps.game.canPlay()) return { ok: false, failure: { kind: 'read-only' }, pending: false };
      try {
        await this.settle(shipmentId, 'cancel');
      } catch (error) {
        return { ok: false, failure: failureOf(error), pending: false };
      }
      return { ok: true, shipmentId };
    });
  }

  // Replays the unfinished steps of the ledger, then claims what the server holds for this City.
  reconcile(shipments: readonly Shipment[], openCityId: string): Promise<ReconcileReport> {
    return this.serial(async () => {
      const report: ReconcileReport = { waitingForRoom: [] };
      if (!this.deps.game.canPlay()) return report;
      await this.replayPending();
      for (const shipment of shipments) {
        if (shipment.toCityId === openCityId && shipment.state !== 'cancelled') await this.receive(shipment, report);
        if (shipment.fromCityId === openCityId && shipment.state === 'cancelled') await this.takeBack(shipment);
      }
      return report;
    });
  }

  private serial<T>(step: () => Promise<T>): Promise<T> {
    const run = this.queue.then(step, step);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private refused(key: ErrorKey): ShipmentOutcome {
    return { ok: false, failure: { kind: 'game', key }, pending: false };
  }

  private async sendCreate(shipmentId: string, toCityId: string, lot: TradeLine[]): Promise<ShipmentOutcome> {
    try {
      await this.deps.client.create(shipmentId, toCityId, lot);
    } catch (error) {
      if (!SEND_REFUSALS.has(kindOf(error))) return { ok: false, failure: failureOf(error), pending: true };
      this.rollback(shipmentLedgerId(shipmentId), 'reserve-lot');
      return { ok: false, failure: failureOf(error), pending: false };
    }
    this.confirm(shipmentLedgerId(shipmentId), 'reserve-lot');
    return { ok: true, shipmentId };
  }

  private confirm(ledgerId: string, effect: TradeEffect): void {
    this.deps.game.apply({ type: 'TradeConfirm', offerId: ledgerId, effect });
    this.deps.game.persist();
  }

  private rollback(ledgerId: string, effect: TradeEffect): void {
    this.deps.game.apply({ type: 'TradeRollback', offerId: ledgerId, effect });
    this.deps.game.persist();
  }

  private async replayPending(): Promise<void> {
    for (const entry of pendingTradeEntries(this.deps.game.state())) {
      if (!isShipmentLedgerId(entry.offerId)) continue;
      if (APPLIED_EFFECTS.has(entry.effect)) {
        this.confirm(entry.offerId, entry.effect);
        continue;
      }
      if (entry.effect === 'reserve-lot') await this.replayCreate(entry.offerId, entry.peer, entry.lot);
    }
  }

  private async replayCreate(ledgerId: string, toCityId: string | undefined, lot: TradeLine[] | undefined): Promise<void> {
    if (!toCityId || !lot) return this.rollback(ledgerId, 'reserve-lot');
    try {
      await this.deps.client.create(ledgerId.slice('shipment:'.length), toCityId, lot);
    } catch (error) {
      if (SEND_REFUSALS.has(kindOf(error))) this.rollback(ledgerId, 'reserve-lot');
      return;
    }
    this.confirm(ledgerId, 'reserve-lot');
  }

  private async receive(shipment: Shipment, report: ReconcileReport): Promise<void> {
    const ledgerId = shipmentLedgerId(shipment.id);
    if (findLedgerEntry(this.deps.game.state(), ledgerId, 'receive-lot')) return;
    if (lotReceiveIssue(this.deps.game.state(), shipment.lot, false)) {
      report.waitingForRoom.push(shipment.id);
      return;
    }
    try {
      await this.settle(shipment.id, 'claim');
    } catch {
      // Left waiting: the next reconciliation tries again.
    }
  }

  private async takeBack(shipment: Shipment): Promise<void> {
    if (findLedgerEntry(this.deps.game.state(), shipmentLedgerId(shipment.id), 'return-lot')) return;
    if (lotReceiveIssue(this.deps.game.state(), shipment.lot, false)) return;
    try {
      await this.settle(shipment.id, 'cancel');
    } catch {
      // Left for the next reconciliation.
    }
  }

  private async settle(shipmentId: string, step: 'claim' | 'cancel'): Promise<void> {
    const { game, client } = this.deps;
    const settlement = step === 'claim' ? await client.claim(shipmentId) : await client.cancel(shipmentId);
    const ledgerId = shipmentLedgerId(shipmentId);
    const key = game.apply({ type: 'TradeApply', offerId: ledgerId, effect: settlement.effect, lot: settlement.lot });
    if (key) throw new ShipmentError('unknown');
    game.persist();
    this.confirm(ledgerId, settlement.effect);
  }
}
