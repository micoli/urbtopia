import { SANCTIONS } from '../balance/sanctions';
import { difficultyOf, type Difficulty } from '../engine/difficulty';
import type { Building, GameState } from '../engine/state';
import { homePower, greenBenefits } from './ecology';
import { climateSatisfaction, homeNeedSatisfactions, needsContext, waterSatisfaction, type NeedsContext } from './needs';
import type { NeedFactorId, SanctionableFactorId } from './needFactors';
import { homeBenefits, wellbeingTaxFactor } from './wellbeing';
import { isAdapting } from './adaptation';
import { isHomeType } from '../buildings/buildingDefinitions';
import { citizensOf } from '../buildings/city';
import { TAX } from '../economy/economy';
import { energySavingOf, taxMultiplierOf } from '../politics/ordinanceEffects';

export interface HomeSanction {
  factor: SanctionableFactorId | null;
  satisfaction: number;
  multiplier: number;
}

const NO_SANCTION: HomeSanction = { factor: null, satisfaction: 100, multiplier: 1 };

function electricitySatisfaction(state: GameState, home: Building, { energy }: NeedsContext): number {
  const need = homePower(home, energySavingOf(state));
  if (need <= 0) return 100;
  return Math.max(0, Math.min(100, 100 * (energy.supplied.get(home.id) ?? 0) / need));
}

function factorSatisfactions(state: GameState, home: Building, context: NeedsContext, factors: readonly SanctionableFactorId[]): Map<NeedFactorId, number> {
  const values = homeNeedSatisfactions(state, home, context);
  values.set('electricity', electricitySatisfaction(state, home, context));
  values.set('water', waterSatisfaction(state));
  if (factors.includes('climate') && greenBenefits(state, home).cooling <= 0) values.set('climate', climateSatisfaction(state));
  return values;
}

export function homeSanction(state: GameState, home: Building, context: NeedsContext, difficulty: Difficulty = difficultyOf(state)): HomeSanction {
  const { factors, taxFloor } = SANCTIONS[difficulty];
  if (factors.length === 0 || isAdapting(state)) return NO_SANCTION;
  const values = factorSatisfactions(state, home, context, factors);
  let worst: HomeSanction = NO_SANCTION;
  for (const factor of factors) {
    const satisfaction = values.get(factor);
    if (satisfaction === undefined || satisfaction >= worst.satisfaction) continue;
    worst = { factor, satisfaction, multiplier: taxFloor + (1 - taxFloor) * satisfaction / 100 };
  }
  return worst;
}

function powerRatio(state: GameState, home: Building, context: NeedsContext): number {
  if (isAdapting(state)) return 1;
  const need = homePower(home, energySavingOf(state));
  return need > 0 ? (context.energy.supplied.get(home.id) ?? 0) / need : 1;
}

export function homeTaxMultiplier(state: GameState, home: Building, context: NeedsContext): number {
  const { energy, coverage, poweredCasinos, congestion } = context;
  const wellbeing = homeBenefits(state, home, energy.coalRates, coverage, poweredCasinos, congestion).wellbeing;
  const ordinances = taxMultiplierOf(state);
  if (difficultyOf(state) === 'cozy') return powerRatio(state, home, context) * wellbeingTaxFactor(wellbeing) * ordinances;
  return Math.max(1, wellbeingTaxFactor(wellbeing)) * homeSanction(state, home, context).multiplier * ordinances;
}

export interface SanctionedHome {
  home: Building;
  sanction: HomeSanction;
}

export function sanctionedHomes(state: GameState): SanctionedHome[] {
  if (difficultyOf(state) === 'cozy' || isAdapting(state)) return [];
  const context = needsContext(state);
  return state.buildings
    .filter(building => isHomeType(building.type))
    .map(home => ({ home, sanction: homeSanction(state, home, context) }))
    .filter(({ sanction }) => sanction.factor !== null);
}

const ALERT_REFRESH_MS = 60_000;

// Sanctions drift with the time of day and the buildings: an alert refreshes at that pace, not on every tick.
export function sanctionAlertKey(state: GameState): string {
  return [state.seed, difficultyOf(state), Math.floor(state.lastSeen / ALERT_REFRESH_MS), state.buildings.length, state.roads.length].join(':');
}

export function taxLostPerHour({ home, sanction }: SanctionedHome): number {
  return citizensOf(home.tier) * TAX.urbsPerCitizenPerHour * (1 - sanction.multiplier);
}
