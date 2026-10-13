import { readCloudConfig } from '../persistence/cloud/cloudConfig';
import type { ChallengeClient } from './types';

export async function loadChallengeClient(env?: Record<string, unknown>): Promise<ChallengeClient | null> {
  const config = readCloudConfig(env);
  if (!config) return null;
  const { createSupabaseChallengeClient } = await import('./supabaseChallengeClient');
  return createSupabaseChallengeClient(config);
}
