import { FACILITIES, FACILITY_TYPES, type FacilityType } from '../services/facilities';
import { NATURE_FAMILIES, NATURE_MODELS, type NatureType } from '../environment/nature';
import type { Coord } from '../map/coord';
import { HOME_FOOTPRINTS } from '../economy/economy';
import type { Building, BuildingType, Rotation, ShopStack } from '../engine/state';

export interface Footprint {
  width: number;
  depth: number;
}

export interface BuildingSpec {
  footprint: Footprint;
  cost: number;
  requiresRoad: boolean;
  initialSlots: number;
}

const natureSpecs = Object.fromEntries(NATURE_MODELS.map(([type, , family]) => {
  const profile = NATURE_FAMILIES[family];
  return [type, { footprint: { width: profile.size, depth: profile.size }, cost: profile.cost, requiresRoad: false, initialSlots: 0 }];
})) as Record<NatureType, BuildingSpec>;

const facilitySpecs = Object.fromEntries(FACILITY_TYPES.map(type => {
  const { footprint, cost } = FACILITIES[type];
  return [type, { footprint, cost, requiresRoad: true, initialSlots: 0 }];
})) as Record<FacilityType, BuildingSpec>;

export const BUILDING_SPECS: Record<BuildingType, BuildingSpec> = {
  ...natureSpecs,
  ...facilitySpecs,
  tree: { footprint: { width: 1, depth: 1 }, cost: 40, requiresRoad: false, initialSlots: 0 },
  park: { footprint: { width: 2, depth: 2 }, cost: 120, requiresRoad: false, initialSlots: 0 },
  solar: { footprint: { width: 2, depth: 2 }, cost: 400, requiresRoad: false, initialSlots: 0 },
  battery: { footprint: { width: 1, depth: 1 }, cost: 350, requiresRoad: false, initialSlots: 0 },
  backup: { footprint: { width: 2, depth: 2 }, cost: 500, requiresRoad: false, initialSlots: 0 },
  brtStation: { footprint: { width: 1, depth: 1 }, cost: 180, requiresRoad: true, initialSlots: 0 },
  railStation: { footprint: { width: 2, depth: 1 }, cost: 600, requiresRoad: true, initialSlots: 0 },
  busStop: { footprint: { width: 1, depth: 1 }, cost: 60, requiresRoad: true, initialSlots: 0 },
  workshop: { footprint: { width: 2, depth: 2 }, cost: 100, requiresRoad: true, initialSlots: 2 },
  factory: { footprint: { width: 2, depth: 2 }, cost: 250, requiresRoad: true, initialSlots: 2 },
  shop: { footprint: { width: 1, depth: 1 }, cost: 300, requiresRoad: true, initialSlots: 3 },
  storehouse: { footprint: { width: 2, depth: 2 }, cost: 400, requiresRoad: true, initialSlots: 0 },
  home: { footprint: { width: 1, depth: 1 }, cost: 150, requiresRoad: true, initialSlots: 0 },
  powerPlant: { footprint: { width: 1, depth: 1 }, cost: 250, requiresRoad: false, initialSlots: 0 },
  coalPlant: { footprint: { width: 1, depth: 1 }, cost: 150, requiresRoad: false, initialSlots: 0 },
  waterTower: { footprint: { width: 1, depth: 1 }, cost: 200, requiresRoad: false, initialSlots: 0 },
  silo: { footprint: { width: 2, depth: 1 }, cost: 300, requiresRoad: true, initialSlots: 0 },
  packhouse: { footprint: { width: 2, depth: 2 }, cost: 250, requiresRoad: true, initialSlots: 2 },
  farm: { footprint: { width: 2, depth: 2 }, cost: 200, requiresRoad: true, initialSlots: 0 },
  grainSilo: { footprint: { width: 2, depth: 2 }, cost: 300, requiresRoad: true, initialSlots: 0 },
  vault: { footprint: { width: 2, depth: 1 }, cost: 300, requiresRoad: true, initialSlots: 0 },
};

export function footprintOf(type: BuildingType, rotation: number, tier = 1): Footprint {
  const { width, depth } = (type === 'home' ? HOME_FOOTPRINTS[tier - 1] : undefined) ?? BUILDING_SPECS[type].footprint;
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
  return { id, type, x, y, rotation, slotCount, queue: [], stacks, tier: 1, taxCitizenMs: 0, ...(type === 'coalPlant' ? { coalEnabled: true } : {}) };
}

export function placementCost(type: BuildingType): number {
  return BUILDING_SPECS[type].cost;
}

export type { Building };
