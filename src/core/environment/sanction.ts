import { SANCTIONS } from '../balance/sanctions';
import { difficultyOf, type Difficulty } from '../engine/difficulty';
import type { Building, GameState } from '../engine/state';
import { homePower, greenBenefits } from './ecology';
import { climateSatisfaction, homeNeedSatisfactions, waterSatisfaction, type NeedsContext } from './needs';
import type { NeedFactorId, SanctionableFactorId } from './needFactors';
import { homeBenefits, wellbeingTaxFactor } from './wellbeing';
import { isAdapting } from './adaptation';

export interface HomeSanction {
  factor: SanctionableFactorId | null;
  satisfaction: number;
  multiplier: number;
}

const NO_SANCTION: HomeSanction = { factor: null, satisfaction: 100, multiplier: 1 };

function electricitySatisfaction(home: Building, { energy }: NeedsContext): number {
  const need = homePower(home);
  if (need <= 0) return 100;
  return Math.max(0, Math.min(100, 100 * (energy.supplied.get(home.id) ?? 0) / need));
}

function factorSatisfactions(state: GameState, home: Building, context: NeedsContext, factors: readonly SanctionableFactorId[]): Map<NeedFactorId, number> {
  const values = homeNeedSatisfactions(state, home, context);
  values.set('electricity', electricitySatisfaction(home, context));
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
  const need = homePower(home);
  return need > 0 ? (context.energy.supplied.get(home.id) ?? 0) / need : 1;
}

export function homeTaxMultiplier(state: GameState, home: Building, context: NeedsContext): number {
  const { energy, coverage, poweredCasinos, congestion } = context;
  const wellbeing = homeBenefits(state, home, energy.coalRates, coverage, poweredCasinos, congestion).wellbeing;
  if (difficultyOf(state) === 'cozy') return powerRatio(state, home, context) * wellbeingTaxFactor(wellbeing);
  return Math.max(1, wellbeingTaxFactor(wellbeing)) * homeSanction(state, home, context).multiplier;
}
