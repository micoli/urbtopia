import { definitionOf, tiersOf } from '../buildings/buildingDefinitions';
import type { Footprint } from '../buildings/buildingSpecs';
import { CASINO_GAMES, type CasinoGame } from './casinoGames';

export { CASINO_GAMES, type CasinoGame };

const definition = definitionOf('casino');
const tiers = tiersOf('casino');

// Everything per Tier comes from the Casino definition; the Casino boat follows the same Tiers.
export const CASINO = {
  unlockCitizens: definition.unlockCitizens!,
  cost: definition.cost!,
  upgradeCosts: Object.fromEntries(tiers.flatMap(({ upgradeCost }, index) => (upgradeCost ? [[index + 1, upgradeCost.urbs]] : []))) as Record<number, number>,
  footprints: tiers.map(({ footprint }) => ({ width: footprint![0], depth: footprint![1] })) as readonly Footprint[],
  radii: tiers.map(({ radius }) => radius!) as readonly number[],
  wellbeingBonus: tiers.map(({ wellbeingBonus }) => wellbeingBonus!) as readonly number[],
  maxStakes: tiers.map(({ maxStake }) => maxStake!) as readonly number[],
  stakeSteps: definition.stakeSteps! as readonly number[],
  gameMinTier: definition.gameMinTier! as Record<CasinoGame, number>,
};

export const MAX_CASINO_TIER = tiers.length;

const tierOf = (tier: number) => tiers[tier - 1] ?? tiers[0]!;

export function casinoPower(tier: number): number {
  return tierOf(tier).power!;
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

export const blockmatchLevelOfTier = (tier: number): number => tierOf(tier).blockmatchLevel!;

export function stakeStepsOf(tier: number): number[] {
  return CASINO.stakeSteps.filter(step => step <= maxStake(tier));
}

export function gamesOfTier(tier: number): CasinoGame[] {
  return CASINO_GAMES.filter(game => CASINO.gameMinTier[game] <= tier);
}

export function isValidStake(tier: number, stake: number): boolean {
  return stakeStepsOf(tier).includes(stake);
}
