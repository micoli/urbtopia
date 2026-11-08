import { citizensOf, totalCitizens } from '../buildings/city';
import { isHomeType } from '../buildings/buildingDefinitions';
import { diagnosisOf, type Cause, type Diagnosis } from '../diagnosis/diagnosis';
import type { GameState } from '../engine/state';
import type { CongestionStats } from './congestion';
import { jobsOf, workplaceTypes } from './jobs';

// Why Citizens have no Job: the city offers fewer Jobs than it has Citizens, or the Jobs are out of reach of the Homes that lack them.
export function diagnoseJobs(state: GameState, congestion: CongestionStats): Diagnosis {
  const citizens = totalCitizens(state);
  if (citizens === 0 || congestion.unemployed <= 0) return { causes: [] };
  const weight = Math.min(1, congestion.unemployed / citizens);
  const worst = state.buildings
    .filter((building) => isHomeType(building.type))
    .sort((a, b) => (congestion.homes.get(b.id)?.unemployed ?? 0) - (congestion.homes.get(a.id)?.unemployed ?? 0) || a.id - b.id)[0];
  const focus = worst && (congestion.homes.get(worst.id)?.unemployed ?? 0) > 0 ? [{ x: worst.x, y: worst.y }] : [];
  const homesWithout = state.buildings.filter((building) => isHomeType(building.type) && (congestion.homes.get(building.id)?.unemployed ?? 0) > 0 && citizensOf(building.tier) > 0).length;
  const offered = state.buildings.reduce((total, building) => total + (workplaceTypes.includes(building.type) ? jobsOf(building) : 0), 0);
  const short = offered < citizens;
  const cause: Cause = short
    ? { key: 'diagnosis.jobs.short', weight, params: { jobs: Math.round(offered), citizens, unemployed: Math.round(congestion.unemployed) }, focus }
    : { key: 'diagnosis.jobs.unreachable', weight, params: { homes: homesWithout, unemployed: Math.round(congestion.unemployed) }, focus };
  return diagnosisOf([cause]);
}
