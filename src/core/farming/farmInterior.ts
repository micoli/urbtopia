import { interiorBonusOfBuilding } from '../factory/interiorBonus';
import { farmTier } from '../economy/tiers';
import type { Building, GameState } from '../engine/state';

type FarmOf = Pick<Building, 'type' | 'tier' | 'interior' | 'breakerOff'>;

// The Field cap of a Farm, raised by the Sprinklers of its interior that an irrigator serves.
export const farmFieldCapOf = (farm: FarmOf): number => {
  const { fieldCap } = farmTier(farm);
  return fieldCap + Math.round(fieldCap * (interiorBonusOfBuilding(farm).capacity ?? 0));
};

// The Fields belong to no Farm, so the Harvest takes the yield of the best Farm interior of the city.
export const harvestYieldBonusOf = (state: Pick<GameState, 'buildings'>): number =>
  Math.max(0, ...state.buildings.filter(building => building.type === 'farm').map(farm => interiorBonusOfBuilding(farm).yield));
