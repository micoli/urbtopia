import { BUILDING_ENTRIES, type BuildingEntry } from './buildingDefinitions';
import type { AccessMode } from './buildingDefinition';
import { NATURE_FAMILIES } from '../environment/natureFamilies';
import type { Coord } from '../map/coord';
import { HOME_FOOTPRINTS } from '../economy/economy';
import { casinoFootprint } from '../leisure/casino';
import { isVenueType } from '../venues/profiles';
import type { Building, BuildingType, Rotation, ShopStack } from '../engine/state';

export interface Footprint {
  width: number;
  depth: number;
}

export interface BuildingSpec {
  footprint: Footprint;
  cost: number;
  requiresRoad: boolean;
  accessModes: readonly AccessMode[];
  initialSlots: number;
}

function specOf({ footprint, cost, requiresRoad, accessModes, initialSlots, family }: BuildingEntry): BuildingSpec {
  if (family) {
    const profile = NATURE_FAMILIES[family];
    return { footprint: { width: profile.size, depth: profile.size }, cost: profile.cost, requiresRoad: false, accessModes: [], initialSlots: 0 };
  }
  const [width, depth] = footprint!;
  return { footprint: { width, depth }, cost: cost!, requiresRoad: requiresRoad!, accessModes: accessModes ?? (requiresRoad ? ['road'] : []), initialSlots: initialSlots ?? 0 };
}

export const BUILDING_SPECS = Object.fromEntries(BUILDING_ENTRIES.map(entry => [entry.id, specOf(entry)])) as Record<BuildingType, BuildingSpec>;

export function footprintOf(type: BuildingType, rotation: number, tier = 1): Footprint {
  const tiered = type === 'home' ? HOME_FOOTPRINTS[tier - 1] : type === 'casino' ? casinoFootprint(tier) : undefined;
  const { width, depth } = tiered ?? BUILDING_SPECS[type].footprint;
  return rotation % 2 === 0 ? { width, depth } : { width: depth, depth: width };
}

export function footprintTiles(building: { type: BuildingType; x: number; y: number; rotation: Rotation | number; tier?: number }): Coord[] {
  const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
  const tiles: Coord[] = [];
  for (let dy = 0; dy < depth; dy++) {
    for (let dx = 0; dx < width; dx++) tiles.push({ x: building.x + dx, y: building.y + dy });
  }
  return tiles;
}

export function emptyStack(): ShopStack {
  return { good: null, stock: 0, nextSaleAt: null, earned: 0 };
}

export function createBuilding(id: number, type: BuildingType, x: number, y: number, rotation: Rotation): Building {
  const slotCount = BUILDING_SPECS[type].initialSlots;
  const stacks = type === 'shop' ? Array.from({ length: slotCount }, emptyStack) : [];
  return { id, type, x, y, rotation, slotCount, queue: [], stacks, tier: 1, taxCitizenMs: 0, ...(type === 'coalPlant' ? { coalEnabled: true } : {}), ...(isVenueType(type) ? { venue: { fixtures: [], nextFixtureId: 1, takings: 0 } } : {}) };
}

export function placementCost(type: BuildingType): number {
  return BUILDING_SPECS[type].cost;
}

export type { Building };
