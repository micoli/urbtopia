import { utilityCapacity, utilityDemand } from '../buildings/city';
import { farmTier } from '../economy/tiers';
import { storageCapacity, storageUsed } from '../economy/storage';
import { isCropReady } from './growth';
import { seedStockCapacity, seedStockUsed } from './seeds';
import { isCropUnlocked } from '../progression/unlocks';
import { CROPS, type CropId } from './crops';
import { isInsideOwnedParcels, occupiedTiles } from '../map/occupancy';
import { tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { CommandOutcome, ErrorKey } from '../engine/commands';
import type { FieldTile, GameState } from '../engine/state';

export const FIELD_COST = 5;

export function fieldCap(state: GameState): number {
  const farm = state.buildings.find((building) => building.type === 'farm');
  return farm ? farmTier(farm).fieldCap : 0;
}

export function layFields(state: GameState, tiles: readonly Coord[]): CommandOutcome {
  if (!state.buildings.some((building) => building.type === 'farm')) return { key: 'error.noFarm' };
  const occupied = occupiedTiles(state);
  const cap = fieldCap(state);
  const laid: FieldTile[] = [];
  let firstIssue: ErrorKey | null = null;
  for (const tile of tiles) {
    const issue = layIssue(state, tile, occupied, state.fields.length + laid.length, cap, state.urbs - (laid.length + 1) * FIELD_COST);
    if (issue === 'error.fieldCapReached' || issue === 'error.notEnoughUrbs') {
      firstIssue ??= issue;
      break;
    }
    if (issue) {
      firstIssue ??= issue;
      continue;
    }
    occupied.add(tileKey(tile));
    laid.push({ x: tile.x, y: tile.y });
  }
  if (laid.length === 0) return { key: firstIssue ?? 'error.tilesOccupied' };
  return { state: { ...state, urbs: state.urbs - laid.length * FIELD_COST, fields: [...state.fields, ...laid] }, events: [] };
}

function layIssue(state: GameState, tile: Coord, occupied: ReadonlySet<string>, count: number, cap: number, urbsAfter: number): ErrorKey | null {
  if (!isInsideOwnedParcels(state, tile)) return 'error.outsideOwnedParcels';
  if (occupied.has(tileKey(tile))) return 'error.tilesOccupied';
  if (count >= cap) return 'error.fieldCapReached';
  if (urbsAfter < 0) return 'error.notEnoughUrbs';
  return null;
}

export function removeFields(state: GameState, tiles: readonly Coord[]): CommandOutcome {
  const removed = new Set(tiles.map(tileKey));
  const fields = state.fields.filter((field) => !removed.has(tileKey(field)));
  if (fields.length === state.fields.length) return { key: 'error.noFieldHere' };
  return { state: { ...state, fields }, events: [] };
}

export function plantFields(state: GameState, crop: CropId, tiles: readonly Coord[]): CommandOutcome {
  if (!state.buildings.some((building) => building.type === 'farm')) return { key: 'error.noFarm' };
  if (!(crop in CROPS)) return { key: 'error.unknownCommand' };
  if (!isCropUnlocked(state, crop)) return { key: 'error.itemLocked' };
  const targets = new Set(tiles.map(tileKey));
  const capacity = utilityCapacity(state).water;
  let demand = utilityDemand(state).water;
  let seeds = state.seedStock[crop] ?? 0;
  let planted = 0;
  let blocker: ErrorKey | null = null;
  const fields = state.fields.map((field) => {
    if (field.crop || !targets.has(tileKey(field)) || blocker) return field;
    if (seeds < 1) {
      blocker = 'error.noSeeds';
      return field;
    }
    if (demand + CROPS[crop].water > capacity) {
      blocker = 'error.notEnoughWater';
      return field;
    }
    seeds -= 1;
    demand += CROPS[crop].water;
    planted += 1;
    return { ...field, crop: { species: crop, plantedAt: state.lastSeen } };
  });
  if (planted === 0) return { key: blocker ?? 'error.nothingToPlant' };
  return { state: { ...state, fields, seedStock: { ...state.seedStock, [crop]: seeds } }, events: [] };
}

function seedsReturned(species: CropId, tiles: number): number {
  const { yield: perTile, seedShare } = CROPS[species];
  return Math.floor((tiles * perTile * Math.round(seedShare * 100)) / 100);
}

function storedYield(species: CropId, tiles: number): number {
  return tiles * CROPS[species].yield - seedsReturned(species, tiles);
}

export function harvestFields(state: GameState, tiles: readonly Coord[]): CommandOutcome {
  const targets = new Set(tiles.map(tileKey));
  const ready = state.fields.filter((field) => field.crop && targets.has(tileKey(field)) && isCropReady(field.crop, state.lastSeen));
  if (ready.length === 0) return { key: 'error.nothingToCollect' };

  const bySpecies = new Map<CropId, FieldTile[]>();
  for (const field of ready) {
    const species = field.crop!.species;
    bySpecies.set(species, [...(bySpecies.get(species) ?? []), field]);
  }

  const materials = { ...state.storage.materials };
  const seedStock = { ...state.seedStock };
  let room = storageCapacity(state).materials - storageUsed(state.storage).materials;
  let seedRoom = seedStockCapacity(state) - seedStockUsed(state);
  const harvested: FieldTile[] = [];
  for (const [species, fields] of bySpecies) {
    let count = fields.length;
    while (count > 0 && storedYield(species, count) > room) count -= 1;
    if (count === 0) continue;
    const stored = storedYield(species, count);
    const seeds = Math.min(seedsReturned(species, count), seedRoom);
    materials[species] = (materials[species] ?? 0) + stored;
    if (seeds > 0) seedStock[species] = (seedStock[species] ?? 0) + seeds;
    room -= stored;
    seedRoom -= seeds;
    harvested.push(...fields.slice(0, count));
  }
  if (harvested.length === 0) return { key: 'error.storageFull' };

  const done = new Set(harvested);
  return {
    state: {
      ...state,
      seedStock,
      storage: { ...state.storage, materials },
      fields: state.fields.map((field) => (done.has(field) ? { x: field.x, y: field.y } : field)),
    },
    events: [{ type: 'CropsHarvested', tiles: harvested.map((field) => ({ x: field.x, y: field.y, species: field.crop!.species })) }],
  };
}
