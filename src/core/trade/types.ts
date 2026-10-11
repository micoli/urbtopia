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
