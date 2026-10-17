import type { DonationRecord } from '../core';
import { readCloudConfig } from '../persistence/cloud/cloudConfig';
import { loadSharedSupabase } from '../persistence/cloud/sharedSupabase';
import type { DonationClient, DonationSnapshot } from './types';

export function parseDonationSnapshot(value: unknown): DonationSnapshot {
  if (typeof value !== 'object' || value === null || !('value' in value) || !Number.isSafeInteger(value.value) || (value.value as number) < 0 || !('medal' in value)) throw new Error('Invalid donation snapshot');
  if (value.medal === null) return { value: value.value as number, medal: null };
  const medal = value.medal;
  if (typeof medal !== 'object' || medal === null || !('medalCode' in medal) || medal.medalCode !== 'solidarity' || !('nameFr' in medal) || typeof medal.nameFr !== 'string' || !('nameEn' in medal) || typeof medal.nameEn !== 'string' || !('earnedAt' in medal) || typeof medal.earnedAt !== 'string' || !Number.isFinite(Date.parse(medal.earnedAt))) throw new Error('Invalid donation medal');
  return { value: value.value as number, medal: { medalCode: 'solidarity', nameFr: medal.nameFr, nameEn: medal.nameEn, earnedAt: Date.parse(medal.earnedAt) } };
}

export async function loadDonationClient(): Promise<DonationClient | null> {
  const config = readCloudConfig();
  if (!config) return null;
  const { client } = await loadSharedSupabase(config);
  return {
    async record(donations: readonly DonationRecord[]) {
      const { data, error } = await client.rpc('urb_record_donations', { p_donations: donations.map(({ id, value }) => ({ id, value })) });
      if (error) throw error;
      return parseDonationSnapshot(data);
    },
  };
}
