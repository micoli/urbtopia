import type { MedalInfo } from '../challenges/types';
import { solidarityTier } from '../core/economy/solidarity';

export function solidarityMedal(value: number, earnedAt: number): MedalInfo | null {
  const tier = solidarityTier(value);
  if (tier === 0) return null;
  return {
    medalCode: 'solidarity',
    nameFr: `Ville solidaire — ${['bronze', 'argent', 'or'][tier - 1]}`,
    nameEn: `Solidary city — ${['bronze', 'silver', 'gold'][tier - 1]}`,
    earnedAt,
  };
}
