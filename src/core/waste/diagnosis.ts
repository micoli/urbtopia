import { isHomeType } from '../buildings/buildingDefinitions';
import { citizensOf } from '../buildings/city';
import { diagnosisOf, type Cause, type Diagnosis } from '../diagnosis/diagnosis';
import type { Building, GameState } from '../engine/state';
import { isAdapting } from '../environment/adaptation';
import { wasteReport, type WasteCause, type WasteReport } from './waste';
import { centerOf } from '../environment/ecology';
import { isWithinReach } from '../services/facilities';
import { WASTE_FACILITIES, wasteKindOf } from './wasteBalance';
import { incineratorPenaltyOf, odorPenaltyOf } from './wasteNuisance';
import { wasteSituation, type WasteSituation } from './wasteSituation';

export const WASTE_DIAGNOSIS = {
  minSurchargeShare: 0.2,
};

interface Facts {
  state: GameState;
  report: WasteReport;
  situation: WasteSituation;
  homes: readonly Building[];
  citizens: number;
}

const tileOf = (building: Building) => ({ x: building.x, y: building.y });
const largestFirst = (a: Building, b: Building) => citizensOf(b.tier) - citizensOf(a.tier) || a.id - b.id;
const citizensIn = (homes: readonly Building[]) => homes.reduce((sum, home) => sum + citizensOf(home.tier), 0);

function homesWith(facts: Facts, ...causes: WasteCause[]): Building[] {
  return facts.homes.filter(home => {
    const cause = facts.report.homes.get(home.id)?.cause;
    return cause !== null && cause !== undefined && causes.includes(cause);
  }).sort(largestFirst);
}

function noFacility(facts: Facts): Cause {
  return { key: 'diagnosis.waste.noFacility', weight: 1, params: { produced: Math.round(facts.situation.produced) }, focus: [] };
}

function capacityShort(facts: Facts): Cause | null {
  const { situation } = facts;
  const homes = homesWith(facts, 'capacityFull');
  if (homes.length === 0 || situation.capacity >= situation.produced) return null;
  return {
    key: 'diagnosis.waste.capacityShort',
    weight: citizensIn(homes) / facts.citizens,
    params: { produced: Math.round(situation.produced), capacity: Math.round(situation.capacity), missing: Math.round(situation.unprocessed) },
    focus: [tileOf(homes[0]!)],
  };
}

function facilitiesStopped(facts: Facts): Cause | null {
  const { state, report } = facts;
  const paying = state.urbs > 1e-9;
  const stopped = state.buildings
    .filter(building => wasteKindOf(building.type))
    .sort((a, b) => a.id - b.id)
    .flatMap(building => {
      const served = report.facilities.get(building.id);
      if (!served) return [];
      if (!paying) return [{ building, reason: 'noUrbs' }];
      if (!served.linked) return [{ building, reason: 'noRoad' }];
      return served.powerRatio === 0 ? [{ building, reason: 'noPower' }] : [];
    });
  if (stopped.length === 0) return null;
  const reasons = ['noUrbs', 'noRoad', 'noPower'] as const;
  const count = (reason: string) => stopped.filter(entry => entry.reason === reason).length;
  const reason = reasons.reduce((best, candidate) => (count(candidate) > count(best) ? candidate : best));
  const first = stopped.find(entry => entry.reason === reason)!.building;
  const left = facts.homes.filter(home => facts.report.homes.get(home.id)?.cause && stopped.some(({ building }) => reaches(building, home)));
  return {
    key: `diagnosis.waste.stopped.${reason}`,
    weight: citizensIn(left) / facts.citizens,
    params: { count: count(reason), citizens: citizensIn(left) },
    focus: [tileOf(first)],
  };
}

function reaches(facility: Building, home: Building): boolean {
  const from = centerOf(facility);
  const to = centerOf(home);
  return isWithinReach(to.x - from.x, to.y - from.y, WASTE_FACILITIES[wasteKindOf(facility.type)!].reach);
}

function homesCause(facts: Facts, key: string, ...causes: WasteCause[]): Cause | null {
  const homes = homesWith(facts, ...causes);
  if (homes.length === 0) return null;
  return { key, weight: citizensIn(homes) / facts.citizens, params: { homes: homes.length, citizens: citizensIn(homes) }, focus: [tileOf(homes[0]!)] };
}

function carriedSurcharge(facts: Facts): Cause | null {
  const { situation, report } = facts;
  if (situation.pedestrianHomes === 0 || situation.costPerDay === 0 || situation.pedestrianSurcharge / situation.costPerDay < WASTE_DIAGNOSIS.minSurchargeShare) return null;
  const homes = facts.homes.filter(home => report.homes.get(home.id)?.carried).sort(largestFirst);
  return {
    key: 'diagnosis.waste.carriedSurcharge',
    weight: citizensIn(homes) / facts.citizens,
    params: { homes: homes.length, extra: Math.round(situation.pedestrianSurcharge) },
    focus: [tileOf(homes[0]!)],
  };
}

function nuisance(facts: Facts, key: string, penaltyOf: (state: GameState, home: Building) => number): Cause | null {
  const homes = facts.homes.filter(home => penaltyOf(facts.state, home) > 0).sort(largestFirst);
  if (homes.length === 0) return null;
  return { key, weight: citizensIn(homes) / facts.citizens, params: { homes: homes.length }, focus: [tileOf(homes[0]!)] };
}

export function diagnoseWaste(state: GameState): Diagnosis {
  const report = wasteReport(state);
  if (!report.required || isAdapting(state)) return { causes: [] };
  const homes = state.buildings.filter(building => isHomeType(building.type));
  const citizens = citizensIn(homes);
  if (citizens === 0) return { causes: [] };
  const facts: Facts = { state, report, situation: wasteSituation(state), homes, citizens };
  if (report.facilities.size === 0) return diagnosisOf([noFacility(facts)]);
  const causes = [
    capacityShort(facts),
    facilitiesStopped(facts),
    homesCause(facts, 'diagnosis.waste.noRoadLink', 'noRoadLink'),
    homesCause(facts, 'diagnosis.waste.farFromFacilities', 'outOfReach', 'beyondCarryingDistance'),
    carriedSurcharge(facts),
    nuisance(facts, 'diagnosis.waste.odor', odorPenaltyOf),
    nuisance(facts, 'diagnosis.waste.incinerator', incineratorPenaltyOf),
  ].flatMap(cause => cause ?? []);
  return diagnosisOf(causes);
}
