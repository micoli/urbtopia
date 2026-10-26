import { readCloudConfig } from '../persistence/cloud/cloudConfig';
import type { SocialClient } from './types';

export async function loadSocialClient(cityId: string, env?: Record<string, unknown>): Promise<SocialClient | null> {
  const config = readCloudConfig(env);
  if (!config) return null;
  const { createSupabaseSocialClient } = await import('./supabaseSocialClient');
  return createSupabaseSocialClient(config, cityId);
}
