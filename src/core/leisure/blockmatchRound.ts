import { blockmatchLevelOfTier } from './casino';

export const BLOCKMATCH_STAR_BONUS: readonly number[] = [0.25, 0.5, 1];
export const MAX_BLOCKMATCH_STARS = BLOCKMATCH_STAR_BONUS.length;

export function blockmatchLevelNumber(tier: number): number {
  return blockmatchLevelOfTier(tier);
}

export function blockmatchSeed(roundSeed: number): string {
  return `casino-${roundSeed}`;
}

export function blockmatchPayout(stars: number, stake: number): number {
  const bonus = BLOCKMATCH_STAR_BONUS[stars - 1];
  if (bonus === undefined) return 0;
  return stake + Math.floor(stake * bonus);
}
