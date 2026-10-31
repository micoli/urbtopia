import type { Building, GameState } from '../engine/state';
import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import { wasteReport } from './waste';
import { WASTE, WASTE_FACILITIES } from './wasteBalance';
import { buildingsOfType } from '../buildings/buildingIndex';

interface Nuisance {
  x: number;
  y: number;
  malus: number;
}

// Every Home asks for the same few sources, so they are listed once per state.
const sourcesCache = new WeakMap<GameState, { mounds: Nuisance[]; incinerators: Nuisance[] }>();

function nuisanceSources(state: GameState): { mounds: Nuisance[]; incinerators: Nuisance[] } {
  const cached = sourcesCache.get(state);
  if (cached) return cached;
  const report = wasteReport(state);
  const { odor } = WASTE_FACILITIES.mound;
  const { pollution } = WASTE_FACILITIES.incinerator;
  const mounds = !odor ? [] : buildingsOfType(state.buildings, 'mound')
    .filter(facility => report.facilities.get(facility.id)?.processed)
    .map(facility => ({ ...centerOf(facility), malus: odor.malus }));
  const incinerators = !pollution ? [] : buildingsOfType(state.buildings, 'incinerator').flatMap(facility => {
    const served = report.facilities.get(facility.id);
    return served && served.processed > 0 ? [{ ...centerOf(facility), malus: pollution.malus * served.processed / served.capacity }] : [];
  });
  const sources = { mounds, incinerators };
  sourcesCache.set(state, sources);
  return sources;
}

// The worst Mound around a Home, never summed. A Mound smells as soon as it processes Waste.
export function odorPenaltyOf(state: GameState, home: Building): number {
  const { odor } = WASTE_FACILITIES.mound;
  const { mounds } = nuisanceSources(state);
  if (!odor || mounds.length === 0) return 0;
  const to = centerOf(home);
  return mounds.some(source => isWithinReach(to.x - source.x, to.y - source.y, odor.radius)) ? odor.malus : 0;
}

// Incinerators join the other sources of Pollution; their smoke grows with the Waste burnt against their capacity.
export function incineratorPenaltyOf(state: GameState, home: Building): number {
  const { pollution } = WASTE_FACILITIES.incinerator;
  const { incinerators } = nuisanceSources(state);
  if (!pollution || incinerators.length === 0) return 0;
  const to = centerOf(home);
  let total = 0;
  for (const source of incinerators) {
    if (isWithinReach(to.x - source.x, to.y - source.y, pollution.radius)) total += source.malus;
  }
  return total;
}

// Emissions per hour, in proportion to the Waste burnt.
export function wasteEmissions(state: GameState): number {
  const burntPerDay = [...wasteReport(state).facilities.values()].reduce((sum, served) => sum + (served.kind === 'incinerator' ? served.processed : 0), 0);
  return burntPerDay / WASTE.dayHours * WASTE_FACILITIES.incinerator.emissionsPerUnit;
}
