import { isHomeType } from '../buildings/buildingDefinitions';
import { citizensOf } from '../buildings/city';
import type { GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { wasteReport, type WasteCause } from './waste';
import { WASTE, WASTE_KINDS, wasteKindOf, type WasteKind } from './wasteBalance';
import { incineratorPenaltyOf, odorPenaltyOf, wasteEmissions } from './wasteNuisance';

export const WASTE_CAUSES: readonly WasteCause[] = ['outOfReach', 'capacityFull', 'noRoadLink', 'beyondCarryingDistance', 'facilityStopped'];

export interface WasteFamilySituation {
  kind: WasteKind;
  buildings: number;
  capacity: number;
  nominalCapacity: number;
  processed: number;
  costPerDay: number;
  stoppedNoUrbs: number;
  stoppedNoRoad: number;
  stoppedPowerShortage: number;
  reducedByPower: number;
}

export interface WasteCauseSituation {
  cause: WasteCause;
  homes: number;
  citizens: number;
}

export interface WasteSituation {
  required: boolean;
  produced: number;
  processed: number;
  capacity: number;
  unprocessed: number;
  unprocessedShare: number;
  costPerDay: number;
  families: WasteFamilySituation[];
  coveredHomes: number;
  uncoveredHomes: number;
  causes: WasteCauseSituation[];
  odorHomes: number;
  incineratorHomes: number;
  incineratorEmissionsPerHour: number;
  pedestrianHomes: number;
  pedestrianSurcharge: number;
  bottleneck: Coord | null;
}

function stoppedFacilities(state: GameState): { id: number; tile: Coord; noRoad: boolean }[] {
  const report = wasteReport(state);
  const paying = state.urbs > 1e-9;
  return state.buildings.flatMap(building => {
    const served = report.facilities.get(building.id);
    if (!served || (paying && served.linked && served.powerRatio > 0)) return [];
    return [{ id: building.id, tile: { x: building.x, y: building.y }, noRoad: !served.linked }];
  });
}

function bottleneckOf(state: GameState, causes: readonly WasteCauseSituation[]): Coord | null {
  const report = wasteReport(state);
  if (report.required && causes.some(({ homes }) => homes > 0)) {
    const worst = state.buildings
      .filter(building => isHomeType(building.type) && report.homes.get(building.id)?.cause)
      .sort((a, b) => citizensOf(b.tier) - citizensOf(a.tier) || a.id - b.id)[0];
    if (worst) return { x: worst.x, y: worst.y };
  }
  return stoppedFacilities(state)[0]?.tile ?? null;
}

export function wasteSituation(state: GameState): WasteSituation {
  const report = wasteReport(state);
  const homes = state.buildings.filter(building => isHomeType(building.type));
  const paying = state.urbs > 1e-9;
  const facilities = [...report.facilities.entries()];
  const capacity = facilities.reduce((sum, [, served]) => sum + served.capacity, 0);
  const families = WASTE_KINDS.map((kind): WasteFamilySituation => {
    const own = facilities.filter(([, served]) => served.kind === kind);
    return {
      kind,
      buildings: state.buildings.filter(building => wasteKindOf(building.type) === kind).length,
      capacity: own.reduce((sum, [, served]) => sum + served.capacity, 0),
      nominalCapacity: own.reduce((sum, [, served]) => sum + served.nominalCapacity, 0),
      processed: own.reduce((sum, [, served]) => sum + served.processed, 0),
      costPerDay: own.reduce((sum, [, served]) => sum + served.cost, 0),
      stoppedNoUrbs: paying ? 0 : own.length,
      stoppedNoRoad: paying ? own.filter(([, served]) => !served.linked).length : 0,
      stoppedPowerShortage: paying ? own.filter(([, served]) => served.linked && served.powerRatio === 0).length : 0,
      reducedByPower: paying ? own.filter(([, served]) => served.powerRatio > 0 && served.powerRatio < 1).length : 0,
    };
  });
  const causes = WASTE_CAUSES.map((cause): WasteCauseSituation => {
    const concerned = homes.filter(building => report.homes.get(building.id)?.cause === cause);
    return { cause, homes: concerned.length, citizens: concerned.reduce((sum, building) => sum + citizensOf(building.tier), 0) };
  });
  const carried = [...report.homes.values()].filter(home => home.carried);
  return {
    required: report.required,
    produced: report.produced,
    processed: report.processed,
    capacity,
    unprocessed: report.produced - report.processed,
    unprocessedShare: report.produced > 0 ? (report.produced - report.processed) / report.produced : 0,
    costPerDay: report.costPerDay,
    families,
    coveredHomes: homes.filter(building => report.homes.get(building.id)?.cause === null).length,
    uncoveredHomes: causes.reduce((sum, entry) => sum + entry.homes, 0),
    causes,
    odorHomes: homes.filter(building => odorPenaltyOf(state, building) > 0).length,
    incineratorHomes: homes.filter(building => incineratorPenaltyOf(state, building) > 0).length,
    incineratorEmissionsPerHour: wasteEmissions(state),
    pedestrianHomes: carried.length,
    pedestrianSurcharge: carried.reduce((sum, home) => sum + home.cost * (1 - 1 / WASTE.carriedSurcharge), 0),
    bottleneck: bottleneckOf(state, causes),
  };
}
