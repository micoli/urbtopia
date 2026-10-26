import type { TradeLine } from '../core';

export type ShipmentErrorKind =
  | 'offline'
  | 'unauthenticated'
  | 'shipment-invalid'
  | 'shipment-conflict'
  | 'shipment-unavailable'
  | 'city-unknown'
  | 'cap-shipments-waiting'
  | 'rate-limited'
  | 'unknown';

export class ShipmentError extends Error {
  constructor(
    readonly kind: ShipmentErrorKind,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(`shipment-${kind}`);
  }
}

export type ShipmentState = 'waiting' | 'claimed' | 'cancelled';

export interface Shipment {
  id: string;
  fromCityId: string;
  toCityId: string;
  lot: TradeLine[];
  state: ShipmentState;
  createdAt: number;
  updatedAt: number;
}

export interface ShipmentSettlement {
  shipmentId: string;
  effect: 'receive-lot' | 'return-lot';
  lot: TradeLine[];
  alreadyDone: boolean;
}

// A client acts for one City of the account: the one that sends, cancels or claims.
export interface ShipmentClient {
  create(id: string, toCityId: string, lot: TradeLine[]): Promise<void>;
  list(): Promise<Shipment[]>;
  claim(id: string): Promise<ShipmentSettlement>;
  cancel(id: string): Promise<ShipmentSettlement>;
}
