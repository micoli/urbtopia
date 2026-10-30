import { definitionOf } from '../buildings/buildingDefinitions';
import type { Building, GameState } from '../engine/state';
import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import type { CongestionStats } from '../traffic/congestion';
import { GATHERING_REACH, movingGathering } from './gatheringWindow';

// Well-being lost by the Homes around an Attraction while its crowd moves, at most this much, in proportion to the share of that crowd who drive.
export const GATHERING_MALUS = 5;

interface MovingCrowd {
  center: { x: number; y: number };
  radius: number;
  penalty: number;
}

const crowdsByStats = new WeakMap<CongestionStats, { state: GameState; crowds: readonly MovingCrowd[] }>();

// The crowds under way, worked out once for the state: every Home asks.
function movingCrowds(state: GameState, congestion: CongestionStats): readonly MovingCrowd[] {
  const known = crowdsByStats.get(congestion);
  if (known?.state === state) return known.crowds;
  const crowds = state.buildings.flatMap(attraction => {
    if (!movingGathering(attraction, state.lastSeen)) return [];
    const flows = congestion.touristFlows.filter(flow => flow.to === attraction.id);
    const total = flows.reduce((sum, flow) => sum + flow.count, 0);
    if (total <= 0) return [];
    const driving = flows.filter(flow => flow.mode === 'car').reduce((sum, flow) => sum + flow.count, 0);
    return [{ center: centerOf(attraction), radius: definitionOf(attraction.type).radius ?? GATHERING_REACH, penalty: GATHERING_MALUS * (driving / total) }];
  });
  crowdsByStats.set(congestion, { state, crowds });
  return crowds;
}

export function gatheringPenaltyOf(state: GameState, home: Building, congestion: CongestionStats): number {
  const crowds = movingCrowds(state, congestion);
  if (crowds.length === 0) return 0;
  const to = centerOf(home);
  return crowds.reduce((penalty, crowd) => (isWithinReach(to.x - crowd.center.x, to.y - crowd.center.y, crowd.radius) ? Math.max(penalty, crowd.penalty) : penalty), 0);
}
