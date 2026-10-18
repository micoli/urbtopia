import { economicPower } from '../environment/ecology';
import { energyStats } from '../environment/energy';
import { isHomeType } from '../buildings/buildingDefinitions';
import type { GameState } from '../engine/state';
import { wasteReport, type WasteCause } from './waste';
import { WASTE, WASTE_FACILITIES, WASTE_KINDS, wasteKindOf, type WasteKind } from './wasteBalance';
import { incineratorPenaltyOf, odorPenaltyOf, wasteEmissions } from './wasteNuisance';

export type WasteStop = 'noUrbs' | 'powerShortage';

export interface WasteKindFigures {
  kind: WasteKind;
  buildings: number;
  capacity: number;
  processed: number;
  cost: number;
  stopped: WasteStop | null;
}

export interface WasteCodexFigures {
  required: boolean;
  produced: number;
  processed: number;
  homes: number;
  uncoveredHomes: number;
  causes: Record<WasteCause, number>;
  carried: { homes: number; distance: number; surcharge: number };
  kinds: WasteKindFigures[];
  costPerDay: number;
  surchargeCostPerDay: number;
  surchargeShare: number;
  nuisance: {
    incinerator: { radius: number; malus: number; homesAffected: number; emissionsPerHour: number };
    mound: { radius: number; malus: number; homesAffected: number };
  };
}

const NO_CAUSES: Record<WasteCause, number> = { outOfReach: 0, capacityFull: 0, noRoadLink: 0, beyondCarryingDistance: 0, facilityStopped: 0 };

function stoppedOf(state: GameState, kind: WasteKind, ids: readonly number[]): WasteStop | null {
  if (ids.length === 0) return null;
  if (state.urbs <= 1e-9) return 'noUrbs';
  if (kind !== 'recyclingPlant') return null;
  const { supplied } = energyStats(state);
  const unpowered = state.buildings.filter(building => ids.includes(building.id) && (supplied.get(building.id) ?? 0) < economicPower(building));
  return unpowered.length === ids.length ? 'powerShortage' : null;
}

// Every figure of the Waste Codex page, from the same report as the simulation.
export function wasteCodexFigures(state: GameState): WasteCodexFigures {
  const report = wasteReport(state);
  const homes = state.buildings.filter(building => isHomeType(building.type));
  const causes = { ...NO_CAUSES };
  for (const home of report.homes.values()) if (home.cause) causes[home.cause]++;
  const carriedHomes = [...report.homes.values()].filter(home => home.carried);
  const surchargeCostPerDay = carriedHomes.reduce((sum, home) => sum + home.cost * (1 - 1 / WASTE.carriedSurcharge), 0);
  const kinds = WASTE_KINDS.map((kind): WasteKindFigures => {
    const ids = state.buildings.filter(building => wasteKindOf(building.type) === kind).map(building => building.id);
    const served = ids.flatMap(id => report.facilities.get(id) ?? []);
    return {
      kind,
      buildings: ids.length,
      capacity: served.reduce((sum, facility) => sum + facility.capacity, 0),
      processed: served.reduce((sum, facility) => sum + facility.processed, 0),
      cost: served.reduce((sum, facility) => sum + facility.cost, 0),
      stopped: stoppedOf(state, kind, ids),
    };
  });
  const { incinerator, mound } = WASTE_FACILITIES;
  return {
    required: report.required,
    produced: report.produced,
    processed: report.processed,
    homes: homes.length,
    uncoveredHomes: [...report.homes.values()].filter(home => home.cause !== null).length,
    causes,
    carried: { homes: carriedHomes.length, distance: WASTE.carryingDistance, surcharge: WASTE.carriedSurcharge },
    kinds,
    costPerDay: report.costPerDay,
    surchargeCostPerDay,
    surchargeShare: report.costPerDay > 0 ? surchargeCostPerDay / report.costPerDay : 0,
    nuisance: {
      incinerator: { radius: incinerator.pollution?.radius ?? 0, malus: incinerator.pollution?.malus ?? 0, homesAffected: homes.filter(home => incineratorPenaltyOf(state, home) > 0).length, emissionsPerHour: wasteEmissions(state) },
      mound: { radius: mound.odor?.radius ?? 0, malus: mound.odor?.malus ?? 0, homesAffected: homes.filter(home => odorPenaltyOf(state, home) > 0).length },
    },
  };
}
