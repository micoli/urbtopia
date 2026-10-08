import { citizenCount } from '../environment/ecology';
import { GAME_CONFIG } from '../engine/config';
import { tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { CommandOutcome } from '../engine/commands';
import type { Boat, BoatFamily, Building, GameState } from '../engine/state';
import { connectedWaterKeys, marinaCapacity } from './marina';

export const BOAT_FAMILIES: readonly BoatFamily[] = ['pleasure'];

export const BOATS = {
  pleasure: { cost: 400, unlockCitizens: 80, radius: 6, wellbeingBonus: 4, operatingCostPerHour: 2 },
} as const;

const FUNDS_EPSILON = 1e-9;

export function boatsOf(state: GameState): readonly Boat[] {
  return state.boats ?? [];
}

export function marinaOf(state: GameState, marinaId: number): Building | undefined {
  return state.buildings.find((building) => building.id === marinaId && building.type === 'marina');
}

export function boatsOfMarina(state: GameState, marinaId: number): Boat[] {
  return boatsOf(state).filter((boat) => boat.marinaId === marinaId);
}

export function isBoatOperating(state: GameState, boat: Boat): boolean {
  return state.urbs > FUNDS_EPSILON && marinaOf(state, boat.marinaId) !== undefined && boat.family in BOATS;
}

export function boatsCutOff(state: GameState): boolean {
  return boatsOf(state).some((boat) => {
    const marina = marinaOf(state, boat.marinaId);
    return !marina || !connectedWaterKeys(state, marina).has(tileKey(boat));
  });
}

export function buyBoat(state: GameState, family: BoatFamily, marinaId: number, tile: Coord): CommandOutcome {
  if (!BOAT_FAMILIES.includes(family)) return { key: 'error.unknownCommand' };
  const spec = BOATS[family];
  if (citizenCount(state) < spec.unlockCitizens) return { key: 'error.itemLocked' };
  const marina = marinaOf(state, marinaId);
  if (!marina) return { key: 'error.unknownBuilding' };
  if (!connectedWaterKeys(state, marina).has(tileKey(tile))) return { key: 'error.notOnMarinaWater' };
  if (boatsOf(state).some((boat) => tileKey(boat) === tileKey(tile))) return { key: 'error.tilesOccupied' };
  if (boatsOfMarina(state, marinaId).length >= marinaCapacity(marina)) return { key: 'error.marinaFull' };
  if (state.urbs < spec.cost) return { key: 'error.notEnoughUrbs' };
  const boat: Boat = { id: state.nextId, family, marinaId, x: tile.x, y: tile.y };
  return {
    state: { ...state, urbs: state.urbs - spec.cost, nextId: state.nextId + 1, boats: [...boatsOf(state), boat] },
    events: [],
  };
}

export function sellBoat(state: GameState, id: number): CommandOutcome {
  const boat = boatsOf(state).find((candidate) => candidate.id === id);
  if (!boat) return { key: 'error.unknownBoat' };
  const refund = Math.floor(BOATS[boat.family].cost * GAME_CONFIG.sellRefundRatio);
  return { state: { ...state, urbs: state.urbs + refund, boats: boatsOf(state).filter((candidate) => candidate !== boat) }, events: [] };
}

export function waterStats(state: GameState): { costPerHour: number; operating: ReadonlySet<number> } {
  const operating = boatsOf(state).filter((boat) => isBoatOperating(state, boat));
  return {
    costPerHour: operating.reduce((sum, boat) => sum + BOATS[boat.family].operatingCostPerHour, 0),
    operating: new Set(operating.map((boat) => boat.id)),
  };
}
