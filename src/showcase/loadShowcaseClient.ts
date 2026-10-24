import { readCloudConfig } from '../persistence/cloud/cloudConfig';
import type { ShowcaseClient } from './types';

export async function loadShowcaseClient(env?: Record<string, unknown>): Promise<ShowcaseClient | null> {
  const config = readCloudConfig(env);
  if (!config) return null;
  const { createSupabaseShowcaseClient } = await import('./supabaseShowcaseClient');
  return createSupabaseShowcaseClient(config);
}
