import { tiersOf } from '../buildings/buildingDefinitions';
import type { Building, GameState } from '../engine/state';
import { connectedWaterKeys } from './marina';
import { tileKey } from '../map/geometry';

export const PIRATE_COVE = {
  waterTilesPerShip: 12,
};

export function seatCapOf(cove: Pick<Building, 'tier'>): number {
  const tiers = tiersOf('pirateCove');
  return (tiers[cove.tier - 1] ?? tiers[0]!).seatCap!;
}

export function pirateCoveOf(state: GameState, id: number): Building | undefined {
  return state.buildings.find((building) => building.id === id && building.type === 'pirateCove');
}

export function pirateShipsOfCove(state: GameState, coveId: number) {
  return (state.boats ?? []).filter((boat) => boat.family === 'pirate' && boat.marinaId === coveId);
}

export function pirateShipLimit(state: GameState, cove: Building): number {
  return Math.floor(connectedWaterKeys(state, cove).size / PIRATE_COVE.waterTilesPerShip);
}

// The limit belongs to the water: every Pirate ship on it counts, whichever Pirate cove it belongs to.
export function pirateShipRoom(state: GameState, cove: Building): number {
  const water = connectedWaterKeys(state, cove);
  const onWater = (state.boats ?? []).filter((boat) => boat.family === 'pirate' && water.has(tileKey(boat))).length;
  return pirateShipLimit(state, cove) - onWater;
}

export function pirateShipsOverLimit(state: GameState): boolean {
  return state.buildings.some((building) => building.type === 'pirateCove' && pirateShipRoom(state, building) < 0);
}

export function isPirateCoveInUse(state: GameState, building: Pick<Building, 'id' | 'type'>): boolean {
  return building.type === 'pirateCove' && pirateShipsOfCove(state, building.id).length > 0;
}
