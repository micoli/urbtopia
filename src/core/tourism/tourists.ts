import { definitionOf } from '../buildings/buildingDefinitions';
import type { BuildingId } from '../buildings/buildingTypes.generated';
import type { Building, GameState } from '../engine/state';
import { cityAttractiveness } from '../venues/hotel';

export const TOURISM = {
  tierBonus: 0.25,
  hotelSpendingBonus: 0.5,
  // Tourists drawn after a successful Championship, relative to usual.
  championshipBoost: 1.5,
};

// Until `boostUntil` a stadium that did well draws more Tourists.
export const boostOf = (building: Pick<Building, 'attraction'>, now: number): number => (now < (building.attraction?.boostUntil ?? 0) ? TOURISM.championshipBoost : 1);

export const attractionPowerOf = (building: Pick<Building, 'type' | 'tier'>): number => {
  const power = definitionOf(building.type).attraction;
  if (!power) return 0;
  return power * (1 + TOURISM.tierBonus * (building.tier - 1));
};

export const isAttractionType = (type: string): boolean => (definitionOf(type as BuildingId).attraction ?? 0) > 0;

export const isAttraction = (building: Pick<Building, 'type'>): boolean => (definitionOf(building.type).attraction ?? 0) > 0;

// Tourists a day the city's Attractions draw, before any Ticket.
export const touristDemand = (state: GameState): number => {
  const power = state.buildings.reduce((total, building) => total + attractionPowerOf(building), 0);
  return power * cityAttractiveness(state);
};

// What a Tourist spends relative to a day-tripper: a Hotel lets them stay and spend more, without drawing more of them.
export const spendingFactor = (state: GameState): number => {
  const lodged = state.buildings.some(building => building.type === 'hotel');
  return lodged ? 1 + TOURISM.hotelSpendingBonus : 1;
};
