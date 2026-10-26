import { readCloudConfig } from '../persistence/cloud/cloudConfig';
import type { ShipmentClient } from './types';

export async function loadShipmentClient(cityId: string, env?: Record<string, unknown>): Promise<ShipmentClient | null> {
  const config = readCloudConfig(env);
  if (!config) return null;
  const { createSupabaseShipmentClient } = await import('./supabaseShipmentClient');
  return createSupabaseShipmentClient(config, cityId);
}
