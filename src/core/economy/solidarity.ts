import { totalCitizens } from '../buildings/city';
import type { GameState } from '../engine/state';
import { GOODS, MATERIALS, isGood, isMaterial, type ItemId } from './items';

export const SOLIDARITY = {
  durationMs: 24 * 3_600_000,
  wellbeingBonus: 5,
  valuePerCitizen: 2,
  minimumValue: 200,
  materialShare: 0.25,
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

export function donationValue(item: ItemId, quantity: number): number {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) return 0;
  if (isGood(item)) return GOODS[item].value * quantity;
  if (isMaterial(item)) return Math.floor(MATERIALS[item].value * quantity * SOLIDARITY.materialShare);
  return 0;
}

export function donationQuote(state: GameState, item: ItemId, quantity: number) {
  const value = donationValue(item, quantity);
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
