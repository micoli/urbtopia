import { ECOLOGY_UNLOCKS, citizenCount } from '../environment/ecology';
import type { BuildingType, GameState } from '../engine/state';
import { BUILDING_SPECS } from './buildingSpecs';

export function isRepeatable(type: BuildingType): boolean {
  return BUILDING_SPECS[type].extraCopyCitizens.length > 0;
}

export function ownedCopies(state: GameState, type: BuildingType): number {
  return state.buildings.filter((building) => building.type === type).length;
}

export function maxCopies(type: BuildingType): number {
  return 1 + BUILDING_SPECS[type].extraCopyCitizens.length;
}

export function allowedCopies(state: GameState, type: BuildingType): number {
  const citizens = citizenCount(state);
  return 1 + BUILDING_SPECS[type].extraCopyCitizens.filter((threshold) => citizens >= threshold).length;
}

export function nextCopyCitizens(state: GameState, type: BuildingType): number | null {
  return BUILDING_SPECS[type].extraCopyCitizens[ownedCopies(state, type) - 1] ?? null;
}

export function copyThresholds(type: BuildingType): number[] {
  return [ECOLOGY_UNLOCKS[type] ?? 0, ...BUILDING_SPECS[type].extraCopyCitizens];
}

export function buildLimitReached(state: GameState, type: BuildingType): boolean {
  return isRepeatable(type) && ownedCopies(state, type) >= allowedCopies(state, type);
}

export function nextCopyCost(state: GameState, type: BuildingType): number {
  const { cost, priceFactor } = BUILDING_SPECS[type];
  return Math.round(cost * priceFactor ** ownedCopies(state, type));
}
