import { definitionOf, kindOf, tiersOf } from '../buildings/buildingDefinitions';
import { footprintOf } from '../buildings/buildingSpecs';
import type { Building, BuildingType, GameState, Rotation } from '../engine/state';
import { connectedWaterKeys, shoreWaterKeys } from './marina';
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
  return building.type === 'pirateCove' && (pirateShipsOfCove(state, building.id).length > 0 || standsOfCove(state, building.id).length > 0);
}

export const isStandsType = (type: string): boolean => kindOf(type) === 'stands';

export const seatsOfStands = (type: BuildingType): number => definitionOf(type).seats ?? 0;

export function standsOfCove(state: GameState, coveId: number): Building[] {
  return state.buildings.filter((building) => isStandsType(building.type) && building.coveId === coveId);
}

// Seats beyond what the Tier of the Pirate cove allows do not count.
export function seatsOfCove(state: GameState, cove: Building): number {
  const seats = standsOfCove(state, cove.id).reduce((total, stands) => total + seatsOfStands(stands.type), 0);
  return Math.min(seats, seatCapOf(cove));
}

type Placed = Pick<Building, 'type' | 'x' | 'y' | 'rotation'>;

const onWaterOf = (state: GameState, stands: Placed, cove: Building): boolean => {
  const water = connectedWaterKeys(state, cove);
  return shoreWaterKeys(state, { ...stands, tier: 1 }).some((key) => water.has(key));
};

function squaredDistance(from: Placed & { tier?: number }, to: Placed & { tier?: number }): number {
  const a = footprintOf(from.type, from.rotation, from.tier);
  const b = footprintOf(to.type, to.rotation, to.tier);
  return (from.x + a.width / 2 - to.x - b.width / 2) ** 2 + (from.y + a.depth / 2 - to.y - b.depth / 2) ** 2;
}

// The nearest Pirate cove whose water these Stands would touch, the lowest id on a tie.
export function coveForStands(state: GameState, type: BuildingType, x: number, y: number, rotation: Rotation): Building | undefined {
  const stands = { type, x, y, rotation };
  const candidates = state.buildings
    .filter((building) => building.type === 'pirateCove' && onWaterOf(state, stands, building))
    .sort((a, b) => squaredDistance(stands, a) - squaredDistance(stands, b) || a.id - b.id);
  return candidates[0];
}

export function standsCanStayAt(state: GameState, coveId: number, stands: Placed): boolean {
  const cove = pirateCoveOf(state, coveId);
  return cove !== undefined && onWaterOf(state, stands, cove);
}

export function standsCutOff(state: GameState): boolean {
  return state.buildings.some((building) => isStandsType(building.type) && !standsCanStayAt(state, building.coveId ?? 0, building));
}
