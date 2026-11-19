import { DISTRICT_PLAN } from './districtPlanBalance';

export type DistrictRank = 'bronze' | 'silver' | 'gold';

// The best Rank a score reaches on a Deck of this size, or undefined below Bronze.
export const rankOf = (score: number, deckSize: number): DistrictRank | undefined => {
  const thresholds = DISTRICT_PLAN.rankScorePerHex;
  if (score >= thresholds.gold * deckSize) return 'gold';
  if (score >= thresholds.silver * deckSize) return 'silver';
  if (score >= thresholds.bronze * deckSize) return 'bronze';
  return undefined;
};
