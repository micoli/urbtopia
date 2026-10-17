import { totalCitizens } from '../buildings/city';
import type { GameState } from '../engine/state';
import { GOODS, isGood, type GoodId } from './items';

export const SOLIDARITY = {
  durationMs: 24 * 3_600_000,
  wellbeingBonus: 5,
  valuePerCitizen: 2,
  minimumValue: 200,
  medalThresholds: [1_000, 10_000, 100_000],
} as const;

export interface DonationRecord {
  id: string;
  value: number;
  accountId?: string;
}

export function solidarityCost(state: GameState): number {
  return Math.max(SOLIDARITY.minimumValue, SOLIDARITY.valuePerCitizen * totalCitizens(state));
}

export function donationQuote(state: GameState, good: GoodId, quantity: number) {
  const value = isGood(good) && Number.isSafeInteger(quantity) && quantity > 0 ? GOODS[good].value * quantity : 0;
  const remainingMs = Math.max(0, Math.min(SOLIDARITY.durationMs, state.solidarityMs ?? 0));
  const durationPerValue = SOLIDARITY.durationMs / solidarityCost(state);
  const addedMs = Math.min(SOLIDARITY.durationMs - remainingMs, value * durationPerValue);
  return { value, addedMs, remainingMs: remainingMs + addedMs, excessValue: Math.max(0, value - addedMs / durationPerValue) };
}

export function solidarityBonus(state: GameState): number {
  return (state.solidarityMs ?? 0) > 0 ? SOLIDARITY.wellbeingBonus : 0;
}

export function solidarityTier(value: number): number {
  return SOLIDARITY.medalThresholds.filter(threshold => value >= threshold).length;
}
