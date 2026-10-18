import type { Building, GameState } from '../engine/state';
import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import { wasteReport } from './waste';
import { WASTE, WASTE_FACILITIES, wasteKindOf } from './wasteBalance';

function reaches(facility: Building, home: Building, radius: number): boolean {
  const from = centerOf(facility);
  const to = centerOf(home);
  return isWithinReach(to.x - from.x, to.y - from.y, radius);
}

// The worst Mound around a Home, never summed. A Mound smells as soon as it processes Waste.
export function odorPenaltyOf(state: GameState, home: Building): number {
  const report = wasteReport(state);
  let worst = 0;
  for (const facility of state.buildings) {
    if (wasteKindOf(facility.type) !== 'mound') continue;
    const { odor } = WASTE_FACILITIES.mound;
    if (!odor || odor.malus <= worst || !(report.facilities.get(facility.id)?.processed)) continue;
    if (reaches(facility, home, odor.radius)) worst = odor.malus;
  }
  return worst;
}

// Incinerators join the other sources of Pollution; their smoke grows with the Waste burnt against their capacity.
export function incineratorPenaltyOf(state: GameState, home: Building): number {
  const report = wasteReport(state);
  const { pollution } = WASTE_FACILITIES.incinerator;
  if (!pollution) return 0;
  let total = 0;
  for (const facility of state.buildings) {
    if (wasteKindOf(facility.type) !== 'incinerator') continue;
    const served = report.facilities.get(facility.id);
    if (!served || served.processed <= 0 || !reaches(facility, home, pollution.radius)) continue;
    total += pollution.malus * served.processed / served.capacity;
  }
  return total;
}

// Emissions per hour, in proportion to the Waste burnt.
export function wasteEmissions(state: GameState): number {
  const burntPerDay = [...wasteReport(state).facilities.values()].reduce((sum, served) => sum + (served.kind === 'incinerator' ? served.processed : 0), 0);
  return burntPerDay / WASTE.dayHours * WASTE_FACILITIES.incinerator.emissionsPerUnit;
}
