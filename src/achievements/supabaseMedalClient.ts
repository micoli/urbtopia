import { readCloudConfig } from '../persistence/cloud/cloudConfig';
import { loadSharedSupabase } from '../persistence/cloud/sharedSupabase';
import type { AchievementMedalClient, AchievementMedalReceipt } from './types';

export function parseMedalReceipt(value: unknown): AchievementMedalReceipt {
  if (typeof value !== 'object' || value === null || !('medalCode' in value) || typeof value.medalCode !== 'string' || !('earned' in value) || typeof value.earned !== 'boolean') throw new Error('Invalid Achievement Medal receipt');
  return { medalCode: value.medalCode, earned: value.earned };
}

export async function loadAchievementMedalClient(): Promise<AchievementMedalClient | null> {
  const config = readCloudConfig();
  if (!config) return null;
  const { client } = await loadSharedSupabase(config);
  return {
    async award(category, nameFr, nameEn) {
      const { data, error } = await client.rpc('urb_record_achievement_medal', { p_category: category, p_name_fr: nameFr, p_name_en: nameEn });
      if (error) throw error;
      return parseMedalReceipt(data);
    },
  };
}
