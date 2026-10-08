import { citizenCount } from '../environment/ecology';
import { GAME_CONFIG } from '../engine/config';
import { tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { CommandOutcome } from '../engine/commands';
import type { Boat, BoatFamily, Building, GameState } from '../engine/state';
import { bridgeKeys } from './bridges';
import { CASINO, MAX_CASINO_TIER, casinoPower } from '../leisure/casino';
import { ECOLOGY } from '../environment/ecology';
import { connectedWaterKeys, marinaCapacity } from './marina';

export const BOAT_FAMILIES: readonly BoatFamily[] = ['pleasure', 'fishing', 'casino'];

export const BOATS = {
  pleasure: { cost: 400, unlockCitizens: 80, radius: 6, wellbeingBonus: 4, operatingCostPerHour: 2 },
  fishing: { cost: 800, unlockCitizens: 100 },
  casino: { cost: 3000, unlockCitizens: 300 },
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
  return boat.family !== 'fishing' && state.urbs > FUNDS_EPSILON && marinaOf(state, boat.marinaId) !== undefined;
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
  if (boatsOf(state).some((boat) => tileKey(boat) === tileKey(tile)) || bridgeKeys(state).has(tileKey(tile))) return { key: 'error.tilesOccupied' };
  if (boatsOfMarina(state, marinaId).length >= marinaCapacity(marina)) return { key: 'error.marinaFull' };
  if (state.urbs < spec.cost) return { key: 'error.notEnoughUrbs' };
  const boat: Boat = { id: state.nextId, family, marinaId, x: tile.x, y: tile.y, ...(family === 'fishing' ? { catchSince: state.lastSeen } : {}), ...(family === 'casino' ? { tier: 1 } : {}) };
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

export function boatTier(boat: Boat): number {
  return boat.tier ?? 1;
}

export function boatOperatingCost(boat: Boat): number {
  if (boat.family === 'pleasure') return BOATS.pleasure.operatingCostPerHour;
  if (boat.family === 'casino') return casinoPower(boatTier(boat)) * ECOLOGY.backupCost;
  return 0;
}

export function upgradeBoat(state: GameState, id: number): CommandOutcome {
  const boat = boatsOf(state).find((candidate) => candidate.id === id);
  if (!boat) return { key: 'error.unknownBoat' };
  if (boat.family !== 'casino') return { key: 'error.cannotProduce' };
  const next = boatTier(boat) + 1;
  const price = CASINO.upgradeCosts[next];
  if (price === undefined || next > MAX_CASINO_TIER) return { key: 'error.maxTier' };
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  return { state: { ...state, urbs: state.urbs - price, boats: boatsOf(state).map((candidate) => (candidate === boat ? { ...boat, tier: next } : candidate)) }, events: [] };
}

export function casinoOf(state: GameState, id: number): { id: number; tier: number } | undefined {
  const building = state.buildings.find((candidate) => candidate.id === id && candidate.type === 'casino');
  if (building) return { id, tier: building.tier };
  const boat = boatsOf(state).find((candidate) => candidate.id === id && candidate.family === 'casino');
  return boat ? { id, tier: boatTier(boat) } : undefined;
}

export function waterStats(state: GameState): { costPerHour: number; operating: ReadonlySet<number> } {
  const operating = boatsOf(state).filter((boat) => isBoatOperating(state, boat));
  return {
    costPerHour: operating.reduce((sum, boat) => sum + boatOperatingCost(boat), 0),
    operating: new Set(operating.map((boat) => boat.id)),
  };
}
