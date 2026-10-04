import type { Footprint } from '../buildings/buildingSpecs';

export type CasinoGame = 'slotMachine' | 'blackjack' | 'blockmatch';

export const CASINO_GAMES: readonly CasinoGame[] = ['slotMachine', 'blackjack', 'blockmatch'];

const THEATER_POWER = 2;

export const CASINO = {
  unlockCitizens: 250,
  cost: 2500,
  upgradeCosts: { 2: 4000, 3: 8000 } as Record<number, number>,
  footprints: [
    { width: 2, depth: 2 },
    { width: 3, depth: 2 },
    { width: 4, depth: 2 },
  ] as readonly Footprint[],
  radii: [8, 10, 12] as readonly number[],
  wellbeingBonus: [6, 7, 8] as readonly number[],
  maxStakes: [100, 500, 2000] as readonly number[],
  stakeSteps: [10, 50, 100, 500, 1000, 2000] as readonly number[],
  powerFactor: 3,
  powerGrowth: 1.5,
  gameMinTier: { slotMachine: 1, blackjack: 2, blockmatch: 3 } as Record<CasinoGame, number>,
};

export const MAX_CASINO_TIER = CASINO.footprints.length;

export function casinoPower(tier: number): number {
  return THEATER_POWER * CASINO.powerFactor * CASINO.powerGrowth ** (tier - 1);
}

export function casinoFootprint(tier: number): Footprint {
  return CASINO.footprints[tier - 1] ?? CASINO.footprints[0]!;
}

export function casinoRadius(tier: number): number {
  return CASINO.radii[tier - 1] ?? CASINO.radii[0]!;
}

export function casinoWellbeingBonus(tier: number): number {
  return CASINO.wellbeingBonus[tier - 1] ?? CASINO.wellbeingBonus[0]!;
}

export function maxStake(tier: number): number {
  return CASINO.maxStakes[tier - 1] ?? CASINO.maxStakes[0]!;
}

export function stakeStepsOf(tier: number): number[] {
  return CASINO.stakeSteps.filter(step => step <= maxStake(tier));
}

export function gamesOfTier(tier: number): CasinoGame[] {
  return CASINO_GAMES.filter(game => CASINO.gameMinTier[game] <= tier);
}

export function isValidStake(tier: number, stake: number): boolean {
  return stakeStepsOf(tier).includes(stake);
}
