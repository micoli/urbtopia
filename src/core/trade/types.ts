export type TradeEffect = 'reserve-lot' | 'pay' | 'receive-lot' | 'receive-payment' | 'return-lot' | 'return-payment';

export interface TradeLine {
  item: string;
  quantity: number;
}

// One local effect of a Trade offer, applied at most once per (offerId, effect).
// `confirmed` turns true once the server acknowledged the matching call, so a replay knows what is left to send.
export interface TradeLedgerEntry {
  offerId: string;
  effect: TradeEffect;
  at: number;
  lot?: TradeLine[];
  urbs?: number;
  peer?: string;
  confirmed: boolean;
}

export const TRADE_LIMITS = { maxLines: 10, maxQuantity: 9_999, maxPrice: 10_000, ledgerRetentionMs: 30 * 24 * 3_600_000 } as const;

export const TRADE_EFFECTS: readonly TradeEffect[] = ['reserve-lot', 'pay', 'receive-lot', 'receive-payment', 'return-lot', 'return-payment'];

// A Shipment between two Cities of one account shares the trade ledger; its entries are told apart by this prefix (ADR 0048).
export const SHIPMENT_LEDGER_PREFIX = 'shipment:';

export function shipmentLedgerId(shipmentId: string): string {
  return `${SHIPMENT_LEDGER_PREFIX}${shipmentId}`;
}

export function isShipmentLedgerId(offerId: string): boolean {
  return offerId.startsWith(SHIPMENT_LEDGER_PREFIX);
}
