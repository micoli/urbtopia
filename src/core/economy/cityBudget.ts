import type { GameState } from '../engine/state';
import type { NeedsContext } from '../environment/needs';
import { homeTaxMultiplier } from '../environment/sanction';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import { officeYieldMultiplierOf } from '../politics/ordinanceEffects';
import { ordinanceById } from '../politics/ordinances';
import { serviceCoverage } from '../services/services';
import { waterStats } from '../water/boats';
import { wasteCostPerHour } from '../waste/waste';
import { citizensOf } from '../buildings/city';
import { isHomeType } from '../buildings/buildingDefinitions';
import { OFFICE, isOfficeType } from './offices';
import { TAX } from './economy';

export const BUDGET_HOURS = 24;

export interface CityBudget {
  expenses: { energy: number; transport: number; water: number; waste: number; ordinances: number; total: number };
  revenues: { tax: number; offices: number; total: number };
  net: number;
}

interface BudgetContext {
  energy: NeedsContext['energy'];
  congestion: NeedsContext['congestion'];
  transport: { costPerHour: number };
}

// What the city's running costs and its Tax and Office flow come to over the next 24 hours, at the current rates.
// Takings, sales and Gatherings are irregular and left out; the Tax is the flow, not what the Homes can hold before it is collected.
export function cityBudget(state: GameState, { energy, congestion, transport }: BudgetContext): CityBudget {
  const coverage = serviceCoverage(state);
  const poweredCasinos = poweredCasinoIds(state, energy.supplied);
  const context: NeedsContext = { energy, coverage, poweredCasinos, congestion };
  const taxPerHour = state.buildings
    .filter(building => isHomeType(building.type))
    .reduce((sum, home) => sum + citizensOf(home.tier) * TAX.urbsPerCitizenPerHour * homeTaxMultiplier(state, home, context), 0);
  const officeIds = new Set(state.buildings.filter(building => isOfficeType(building.type)).map(building => building.id));
  const filledJobs = [...congestion.filledJobs].reduce((sum, [id, count]) => sum + (officeIds.has(id) ? count : 0), 0);
  const officesPerHour = filledJobs * OFFICE.urbsPerJobPerHour * officeYieldMultiplierOf(state);
  const ordinances = (state.politics?.adopted ?? []).reduce((sum, id) => sum + ordinanceById(id).upkeepPerDay, 0);
  const expenses = {
    energy: energy.costPerHour * BUDGET_HOURS,
    transport: transport.costPerHour * BUDGET_HOURS,
    water: waterStats(state).costPerHour * BUDGET_HOURS,
    waste: wasteCostPerHour(state) * BUDGET_HOURS,
    ordinances,
  };
  const totalExpenses = expenses.energy + expenses.transport + expenses.water + expenses.waste + expenses.ordinances;
  const tax = taxPerHour * BUDGET_HOURS;
  const offices = officesPerHour * BUDGET_HOURS;
  return { expenses: { ...expenses, total: totalExpenses }, revenues: { tax, offices, total: tax + offices }, net: tax + offices - totalExpenses };
}
