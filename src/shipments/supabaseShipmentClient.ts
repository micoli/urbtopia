import type { SupabaseClient } from '@supabase/supabase-js';
import type { TradeLine } from '../core';
import type { CloudConfig } from '../persistence/cloud/cloudConfig';
import type { Database, Json } from '../persistence/cloud/database.types';
import { loadSharedSupabase } from '../persistence/cloud/sharedSupabase';
import { parseSettlement, parseShipments } from './parseShipments';
import { ShipmentError, type Shipment, type ShipmentClient, type ShipmentErrorKind, type ShipmentSettlement } from './types';

type Client = SupabaseClient<Database>;

interface PostgrestFailure {
  message: string;
  details?: string | null;
  code?: string;
}

const MESSAGE_KINDS: ReadonlyArray<readonly [string, ShipmentErrorKind]> = [
  ['urb_unauthenticated', 'unauthenticated'],
  ['urb_shipment_invalid', 'shipment-invalid'],
  ['urb_shipment_conflict', 'shipment-conflict'],
  ['urb_shipment_unavailable', 'shipment-unavailable'],
  ['urb_city_unknown', 'city-unknown'],
  ['urb_cap_shipments_waiting', 'cap-shipments-waiting'],
];

export function toShipmentError(failure: PostgrestFailure): ShipmentError {
  if (failure.message.includes('urb_rate_limited')) return new ShipmentError('rate-limited', Number(failure.details ?? 0) || null);
  const known = MESSAGE_KINDS.find(([marker]) => failure.message.includes(marker));
  if (known) return new ShipmentError(known[1]);
  if (failure.code === '28000' || failure.code === '42501') return new ShipmentError('unauthenticated');
  if (/fetch|network|load failed/i.test(failure.message) || failure.code === '') return new ShipmentError('offline');
  return new ShipmentError('unknown');
}

export async function createSupabaseShipmentClient(config: CloudConfig, cityId: string): Promise<ShipmentClient> {
  const { client } = await loadSharedSupabase(config);
  return new SupabaseShipmentClient(client, cityId);
}

class SupabaseShipmentClient implements ShipmentClient {
  constructor(
    private client: Client,
    private cityId: string,
  ) {}

  async create(id: string, toCityId: string, lot: TradeLine[]): Promise<void> {
    await this.call(() => this.client.rpc('urb_create_shipment', { p_id: id, p_from: this.cityId, p_to: toCityId, p_lot: lot as unknown as Json }));
  }

  async list(): Promise<Shipment[]> {
    return parseShipments(await this.call(() => this.client.rpc('urb_list_shipments')));
  }

  async claim(id: string): Promise<ShipmentSettlement> {
    return parseSettlement(await this.call(() => this.client.rpc('urb_claim_shipment', { p_id: id, p_city: this.cityId })));
  }

  async cancel(id: string): Promise<ShipmentSettlement> {
    return parseSettlement(await this.call(() => this.client.rpc('urb_cancel_shipment', { p_id: id, p_city: this.cityId })));
  }

  private async call<T>(request: () => PromiseLike<{ data: T; error: PostgrestFailure | null }>): Promise<T> {
    try {
      const { data, error } = await request();
      if (error) throw toShipmentError(error);
      return data;
    } catch (error) {
      if (error instanceof ShipmentError) throw error;
      throw new ShipmentError('offline');
    }
  }
}
