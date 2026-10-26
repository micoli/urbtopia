import { TRADE_LIMITS, type TradeLine } from '../core';
import { ShipmentError, type Shipment, type ShipmentSettlement, type ShipmentState } from './types';

type Row = Record<string, unknown>;

const STATES: readonly ShipmentState[] = ['waiting', 'claimed', 'cancelled'];

function row(value: unknown): Row {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new ShipmentError('unknown');
  return value as Row;
}

function text(source: Row, key: string): string {
  const value = source[key];
  if (typeof value !== 'string' || value === '') throw new ShipmentError('unknown');
  return value;
}

function time(source: Row, key: string): number {
  const parsed = Date.parse(text(source, key));
  if (!Number.isFinite(parsed)) throw new ShipmentError('unknown');
  return parsed;
}

function parseLot(value: unknown): TradeLine[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > TRADE_LIMITS.maxLines) throw new ShipmentError('unknown');
  return value.map((line) => {
    const entry = row(line);
    const quantity = entry.quantity;
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) throw new ShipmentError('unknown');
    return { item: text(entry, 'item'), quantity };
  });
}

export function parseShipments(json: unknown): Shipment[] {
  if (!Array.isArray(json)) throw new ShipmentError('unknown');
  return json.map((value): Shipment => {
    const source = row(value);
    const state = text(source, 'state');
    if (!STATES.includes(state as ShipmentState)) throw new ShipmentError('unknown');
    return {
      id: text(source, 'id'),
      fromCityId: text(source, 'fromCityId'),
      toCityId: text(source, 'toCityId'),
      lot: parseLot(source.lot),
      state: state as ShipmentState,
      createdAt: time(source, 'createdAt'),
      updatedAt: time(source, 'updatedAt'),
    };
  });
}

export function parseSettlement(json: unknown): ShipmentSettlement {
  const source = row(json);
  const effect = text(source, 'effect');
  if (effect !== 'receive-lot' && effect !== 'return-lot') throw new ShipmentError('unknown');
  const repeated = effect === 'receive-lot' ? source.alreadyClaimed : source.alreadyCancelled;
  if (typeof repeated !== 'boolean') throw new ShipmentError('unknown');
  return { shipmentId: text(source, 'shipmentId'), effect, lot: parseLot(source.lot), alreadyDone: repeated };
}
