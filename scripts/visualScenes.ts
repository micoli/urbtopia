import { BUILDING_SPECS, autoRotation, createBuilding, newGame, placementIssue } from '../src/core';
import { maxTierOf } from '../src/core/economy/tiers';
import type { BuildingType, GameState, RoadTile } from '../src/core';

const FIXED_NOW = Date.UTC(2026, 0, 1, 12);
const BLOCK = 8;

export const CENTER = 64;

function ownedBlock(from: number, to: number): GameState['ownedParcels'] {
  return Array.from({ length: (to - from + 1) ** 2 }, (_, index) => ({ x: from + (index % (to - from + 1)), y: from + Math.floor(index / (to - from + 1)) }));
}

function roadGrid(from: number, to: number): RoadTile[] {
  const tiles: RoadTile[] = [];
  for (let x = from; x <= to; x++) for (let y = from; y <= to; y++) {
    if (x % BLOCK === 0 || y % BLOCK === 0) tiles.push({ x, y, kind: 'road' });
  }
  return tiles;
}

const FILLERS = (Object.keys(BUILDING_SPECS) as BuildingType[])
  .filter(type => BUILDING_SPECS[type].requiresRoad && BUILDING_SPECS[type].footprint.width <= 2 && BUILDING_SPECS[type].footprint.depth <= 2)
  .sort();

function filled(state: GameState, from: number, to: number): GameState {
  let current = state;
  let index = 0;
  for (let y = from; y <= to; y++) for (let x = from; x <= to; x++) {
    for (let attempt = 0; attempt < FILLERS.length; attempt++) {
      const type = FILLERS[(index + attempt) % FILLERS.length]!;
      const tier = 1 + ((index + attempt) % maxTierOf(type));
      const rotation = autoRotation(current, type, x, y, tier);
      if (placementIssue(current, type, x, y, rotation, { tier }) !== null) continue;
      index += attempt + 1;
      current = { ...current, nextId: current.nextId + 1, buildings: [...current.buildings, { ...createBuilding(current.nextId, type, x, y, rotation), tier }] };
      break;
    }
  }
  return current;
}

function baseCity(parcels: GameState['ownedParcels'], roads: RoadTile[]): GameState {
  const state = newGame({ seed: 'visual-baselines', now: FIXED_NOW, tutorial: false, venueTutorials: false });
  return { ...state, urbs: 1_000_000, ownedParcels: parcels, buildings: [], roads, nextId: 100, adaptationUntil: 0 };
}

export function denseCity(): GameState {
  return filled(baseCity(ownedBlock(3, 4), roadGrid(48, 79)), 49, 78);
}

export function cornerCity(): GameState {
  return filled(baseCity(ownedBlock(0, 1), roadGrid(0, 31)), 1, 30);
}

export function venueCity(): { state: GameState; venueId: number } {
  const state = baseCity(ownedBlock(3, 4), roadGrid(48, 79));
  const venue = createBuilding(101, 'arcade', 52, 49, 0);
  return { state: { ...state, nextId: 102, buildings: [venue] }, venueId: venue.id };
}
