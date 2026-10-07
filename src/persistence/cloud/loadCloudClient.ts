import { readCloudConfig } from './cloudConfig';
import type { CloudSaveClient } from './types';

export async function loadCloudClient(env?: Record<string, unknown>): Promise<CloudSaveClient | null> {
  const config = readCloudConfig(env);
  if (!config) return null;
  const { createSupabaseCloudSaveClient } = await import('./supabaseCloudSaveClient');
  return createSupabaseCloudSaveClient(config);
}
