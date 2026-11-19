import { buildingsOfType } from '../buildings/buildingIndex';
import { centerOf } from '../environment/ecology';
import type { Building, GameState } from '../engine/state';
import { valueByTier } from '../interiors/valueByTier';
import { isWithinReach } from '../services/facilities';
import { DISTRICT_PLAN } from './districtPlanBalance';
import { rankOf } from './districtRank';

export const districtCapOf = (tier: number): number => valueByTier(DISTRICT_PLAN.wellbeingCaps, tier);

export const districtRadiusOf = (tier: number): number => valueByTier(DISTRICT_PLAN.radii, tier);

// The Well-being a Planning office gives: the share of its cap that the Rank of its best game earns, derived at each call so a new Tier applies at once.
export const officeBonusOf = (office: Building): number => {
  const best = office.district?.best;
  if (!best) return 0;
  const rank = rankOf(best.score, best.game.deckSize);
  if (!rank) return 0;
  return districtCapOf(office.tier) * DISTRICT_PLAN.rankShares[rank];
};

// A Home takes the best bonus among the offices that reach it, never the sum.
export const districtBonusOf = (state: GameState, home: Building): number => {
  const to = centerOf(home);
  const bonuses = buildingsOfType(state.buildings, 'planningOffice').map(office => {
    const from = centerOf(office);
    return isWithinReach(to.x - from.x, to.y - from.y, districtRadiusOf(office.tier)) ? officeBonusOf(office) : 0;
  });
  return Math.max(0, ...bonuses);
};
