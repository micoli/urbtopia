import { COAL_CAPACITY } from '../economy/economy';
import type { Building } from '../engine/state';
import { interiorBonusOfBuilding } from '../factory/interiorBonus';

type CoalPlant = Pick<Building, 'type' | 'tier' | 'interior' | 'breakerOff'>;

// The Capacity of a Coal Power plant: that of its Tier, raised by the complete Circuits of its Engine room.
export const coalCapacityOf = (plant: CoalPlant): number => (COAL_CAPACITY[plant.tier - 1] ?? 0) * (1 + (interiorBonusOfBuilding(plant).generation ?? 0));

// The share of its pollution that a Coal Power plant keeps: what the complete Circuits of its Engine room do not take away.
export const coalPollutionShareOf = (plant: CoalPlant): number => 1 - (interiorBonusOfBuilding(plant).cleaner ?? 0);
