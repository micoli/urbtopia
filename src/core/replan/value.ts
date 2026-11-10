import { BUILDING_SPECS, placementCost } from '../buildings/buildingSpecs';
import { SLOT_PRICES } from '../economy/economy';
import { isShopType, slotPriceOf } from '../economy/shops';
import { upgradeCostOf } from '../economy/tiers';
import { ECOLOGY } from '../environment/ecology';
import { solarInstallCostOf } from '../environment/solarPanels';
import { FIELD_COST } from '../farming/fields';
import { GAME_CONFIG } from '../engine/config';
import { PEDESTRIAN_WAY_COST_FACTOR } from '../map/roadCost';
import { roadTierUpgradeCost } from '../traffic/roadTier';
import { TRANSIT } from '../transit/transitNetwork';
import { PEDESTRIAN_ACCESS_COST, walkwayCostPerTile } from '../underground/walkways';
import { BOATS } from '../water/boats';
import { bridgeCost } from '../water/bridges';
import { WATER } from '../water/waterTiles';
import type { Boat, BoatFamily, Bridge, Building, BuildingType, NetworkMode, Stash } from '../engine/state';
import type { Coord } from '../map/coord';
import type { TileLayer } from './stashTiles';

// A kind of item of the Stash, which the player can drop for its price.
export type DropGroup =
  | { readonly kind: 'buildings'; readonly type: BuildingType }
  | { readonly kind: 'tiles'; readonly layer: TileLayer; readonly tier?: number; readonly crossing?: boolean }
  | { readonly kind: 'network'; readonly mode: NetworkMode }
  | { readonly kind: 'bridges'; readonly length: number; readonly carrier?: Bridge['carrier'] }
  | { readonly kind: 'boats'; readonly family: BoatFamily };

// What the Building cost to build and to improve: its price, each Tier it went through, the solar panels, the insulation and the Slots bought.
export function buildingValue(building: Building): number {
  const tiers = Array.from({ length: Math.max(0, building.tier - 1) }, (_, index) => upgradeCostOf(building.type, index + 1)?.urbs ?? 0);
  const slots = Array.from({ length: Math.max(0, building.slotCount - BUILDING_SPECS[building.type].initialSlots) }, (_, index) => {
    const slot = BUILDING_SPECS[building.type].initialSlots + index + 1;
    return isShopType(building.type) ? slotPriceOf(building, slot) : SLOT_PRICES[slot] ?? 0;
  });
  return [placementCost(building.type), ...tiers, ...(building.solar ? [solarInstallCostOf(building.type) * building.tier] : []), ...(building.insulated ? [ECOLOGY.insulationCost * building.tier] : []), ...slots].reduce((sum, part) => sum + part, 0);
}

const roadTiers = (tier: number, factor = 1): number => Array.from({ length: Math.max(0, tier - 1) }, (_, index) => roadTierUpgradeCost(index + 1) ?? 0).reduce((sum, cost) => sum + cost * factor, 0);

export function tileValue(layer: TileLayer, tile: Coord & { tier?: number; kind?: string }): number {
  switch (layer) {
    case 'roads':
      return (tile.kind === 'crossing' ? GAME_CONFIG.crossingCost : GAME_CONFIG.roadCostPerTile) + roadTiers(tile.tier ?? 1);
    case 'pedestrianWays':
      return Math.round(GAME_CONFIG.roadCostPerTile * PEDESTRIAN_WAY_COST_FACTOR) + Math.round(roadTiers(tile.tier ?? 1, PEDESTRIAN_WAY_COST_FACTOR));
    case 'walkways':
      return walkwayCostPerTile();
    case 'pedestrianAccesses':
      return PEDESTRIAN_ACCESS_COST;
    case 'roundabouts':
      return GAME_CONFIG.roundaboutCost;
    case 'waterTiles':
      return WATER.tileCost;
    case 'fields':
      return FIELD_COST;
  }
}

export const bridgeValue = (bridge: Bridge): number => bridgeCost(bridge.length, bridge.carrier) ?? 0;

export const boatValue = (boat: Boat): number => BOATS[boat.family].cost;

const NETWORK_KEY = { brt: 'brtRoads', rail: 'rails', metro: 'tunnels' } as const;

const matchesTile = (group: Extract<DropGroup, { kind: 'tiles' }>, tile: { tier?: number; kind?: string }): boolean => {
  if (group.layer !== 'roads' && group.layer !== 'pedestrianWays') return true;
  return (tile.tier ?? 1) === (group.tier ?? 1) && (group.layer !== 'roads' || (tile.kind === 'crossing') === (group.crossing ?? false));
};

// The items of the Stash that the group names, the Stash without them and what they cost.
export function takeGroup(stash: Stash, group: DropGroup): { rest: Partial<Stash>; count: number; value: number } {
  switch (group.kind) {
    case 'buildings': {
      const taken = stash.buildings.filter((building) => building.type === group.type);
      return { rest: { buildings: stash.buildings.filter((building) => building.type !== group.type) }, count: taken.length, value: taken.reduce((sum, building) => sum + buildingValue(building), 0) };
    }
    case 'tiles': {
      const tiles = (stash[group.layer] ?? []) as (Coord & { tier?: number; kind?: string })[];
      const taken = tiles.filter((tile) => matchesTile(group, tile));
      return { rest: { [group.layer]: tiles.filter((tile) => !matchesTile(group, tile)) }, count: taken.length, value: taken.reduce((sum, tile) => sum + tileValue(group.layer, tile), 0) };
    }
    case 'network': {
      const key = NETWORK_KEY[group.mode];
      const tiles = stash[key] ?? [];
      return { rest: { [key]: [] }, count: tiles.length, value: tiles.length * TRANSIT[group.mode].tileCost };
    }
    case 'bridges': {
      const same = (bridge: Bridge) => bridge.length === group.length && bridge.carrier === group.carrier;
      const taken = (stash.bridges ?? []).filter(same);
      return { rest: { bridges: (stash.bridges ?? []).filter((bridge) => !same(bridge)) }, count: taken.length, value: taken.reduce((sum, bridge) => sum + bridgeValue(bridge), 0) };
    }
    case 'boats': {
      const taken = (stash.boats ?? []).filter((boat) => boat.family === group.family);
      return { rest: { boats: (stash.boats ?? []).filter((boat) => boat.family !== group.family) }, count: taken.length, value: taken.reduce((sum, boat) => sum + boatValue(boat), 0) };
    }
  }
}
