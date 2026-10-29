import { definitionOf } from '../buildings/buildingDefinitions';
import type { Building, GameState } from '../engine/state';
import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import type { CongestionStats } from '../traffic/congestion';
import { GATHERING_REACH, movingGathering } from './gatheringWindow';

// Well-being lost by the Homes around an Attraction while its crowd moves, at most this much, in proportion to the share of that crowd who drive.
export const GATHERING_MALUS = 5;

export function gatheringPenaltyOf(state: GameState, home: Building, congestion: CongestionStats): number {
  let penalty = 0;
  const to = centerOf(home);
  for (const attraction of state.buildings) {
    if (!movingGathering(attraction, state.lastSeen)) continue;
    const flows = congestion.touristFlows.filter(flow => flow.to === attraction.id);
    const total = flows.reduce((sum, flow) => sum + flow.count, 0);
    if (total <= 0) continue;
    const driving = flows.filter(flow => flow.mode === 'car').reduce((sum, flow) => sum + flow.count, 0);
    const from = centerOf(attraction);
    if (!isWithinReach(to.x - from.x, to.y - from.y, definitionOf(attraction.type).radius ?? GATHERING_REACH)) continue;
    penalty = Math.max(penalty, GATHERING_MALUS * (driving / total));
  }
  return penalty;
}
