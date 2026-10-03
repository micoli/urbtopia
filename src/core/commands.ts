import { BUILDING_SPECS, createBuilding, emptyStack, placementCost } from './buildingSpecs';
import { advance } from './advance';
import { GAME_CONFIG } from './config';
import type { Coord } from './coord';
import type { GameEvent } from './events';
import { tileKey } from './geometry';
import { utilityCapacity, utilityDemand, type UtilityTotals } from './city';
import { HOME_TIERS, HOME_UPGRADE_COSTS, MAX_HOME_TIER, MAX_SLOTS, SHOP, TAX, SLOT_PRICES, STORAGE_UPGRADE_COSTS } from './economy';
import { GOODS, isGood, isMaterial, producibleItems, recipeOf, type GoodId } from './items';
import { marketQuote } from './market';
import { isItemUnlocked } from './unlocks';
import { isAdjacentToOwned, isInsideMap, isOwned, parcelPrice } from './parcels';
import { isInsideOwnedParcels, occupiedTiles, roadExits, roundaboutTiles } from './occupancy';
import { autoRotation, frontTouchesRoad, placementIssue } from './placement';
import { isIdle, newQueueEntry, restartRunningProduction, shiftRunningTimers, taxDue } from './production';
import { roadBuildCost, missingRoadTiles } from './roadCost';
import { roadPath } from './roads';
import { hasStorehouse, isStorageEmpty, storageCapacity, storageUsed } from './storage';
import type { Building, BuildingType, GameState, QueueEntry, Rotation } from './state';

const HOUR_MS = 60 * 60 * 1000;

export type Command =
  | { readonly type: 'BuildRoad'; readonly from: Coord; readonly to: Coord; readonly horizontalFirst?: boolean }
  | { readonly type: 'PlaceCrossing'; readonly x: number; readonly y: number }
  | { readonly type: 'PlaceRoundabout'; readonly x: number; readonly y: number }
  | { readonly type: 'DemolishRoad'; readonly x: number; readonly y: number }
  | { readonly type: 'PlaceBuilding'; readonly buildingType: BuildingType; readonly x: number; readonly y: number; readonly rotation?: Rotation }
  | { readonly type: 'QueueProduction'; readonly buildingId: number; readonly item: string }
  | { readonly type: 'Collect'; readonly buildingId: number }
  | { readonly type: 'StockShop'; readonly buildingId: number; readonly good: GoodId }
  | { readonly type: 'SellToMarket'; readonly good: GoodId; readonly quantity: number }
  | { readonly type: 'UpgradeHome'; readonly buildingId: number }
  | { readonly type: 'BuyParcel'; readonly x: number; readonly y: number }
  | { readonly type: 'BuySlot'; readonly buildingId: number }
  | { readonly type: 'UpgradeStorehouse' }
  | { readonly type: 'SellBuilding'; readonly id: number }
  | { readonly type: 'MoveBuilding'; readonly id: number; readonly x: number; readonly y: number; readonly rotation?: Rotation }
  | { readonly type: 'SkipTime'; readonly hours: number };

export type ErrorKey =
  | 'error.unknownCommand'
  | 'error.unknownBuilding'
  | 'error.outsideOwnedParcels'
  | 'error.tilesOccupied'
  | 'error.needsRoad'
  | 'error.storehouseExists'
  | 'error.notEnoughUrbs'
  | 'error.lastRoadOfBuilding'
  | 'error.noRoadHere'
  | 'error.invalidCrossing'
  | 'error.cannotProduce'
  | 'error.queueFull'
  | 'error.nothingToCollect'
  | 'error.noStorehouse'
  | 'error.storageFull'
  | 'error.storehouseNotEmpty'
  | 'error.missingMaterials'
  | 'error.maxSlots'
  | 'error.maxLevel'
  | 'error.notAShop'
  | 'error.missingGoods'
  | 'error.marketLocked'
  | 'error.invalidQuantity'
  | 'error.outsideMap'
  | 'error.parcelOwned'
  | 'error.parcelNotAdjacent'
  | 'error.notEnoughPower'
  | 'error.notEnoughWater'
  | 'error.utilityInUse'
  | 'error.itemLocked'
  | 'error.notAHome'
  | 'error.maxTier';

export interface CommandError {
  key: ErrorKey;
}

export type CommandOutcome = { state: GameState; events: GameEvent[] } | CommandError;

export function isError(outcome: CommandOutcome): outcome is CommandError {
  return 'key' in outcome;
}

const fail = (key: ErrorKey): CommandError => ({ key });

export function handleCommand(state: GameState, command: Command, now: number): CommandOutcome {
  switch (command.type) {
    case 'BuildRoad':
      return buildRoad(state, command.from, command.to, command.horizontalFirst ?? true);
    case 'PlaceCrossing':
      return placeCrossing(state, { x: command.x, y: command.y });
    case 'PlaceRoundabout':
      return placeRoundabout(state, { x: command.x, y: command.y });
    case 'DemolishRoad':
      return demolishRoad(state, { x: command.x, y: command.y });
    case 'PlaceBuilding':
      return placeBuilding(state, command.buildingType, command.x, command.y, command.rotation);
    case 'QueueProduction':
      return queueProduction(state, command.buildingId, command.item, now);
    case 'Collect':
      return collect(state, command.buildingId);
    case 'StockShop':
      return stockShop(state, command.buildingId, command.good, now);
    case 'SellToMarket':
      return sellToMarket(state, command.good, command.quantity, now);
    case 'UpgradeHome':
      return upgradeHome(state, command.buildingId);
    case 'BuyParcel':
      return buyParcel(state, { x: command.x, y: command.y });
    case 'BuySlot':
      return buySlot(state, command.buildingId);
    case 'UpgradeStorehouse':
      return upgradeStorehouse(state);
    case 'SellBuilding':
      return sellBuilding(state, command.id);
    case 'MoveBuilding':
      return moveBuilding(state, command.id, command.x, command.y, command.rotation, now);
    case 'SkipTime':
      return skipTime(state, command.hours, now);
    default:
      return fail('error.unknownCommand');
  }
}

function skipTime(state: GameState, hours: number, now: number): CommandOutcome {
  const skippedMs = hours * HOUR_MS;
  const earlier = { ...shiftRunningTimers(state, -skippedMs), lastSeen: state.lastSeen - skippedMs };
  return advance(earlier, now);
}

function buildRoad(state: GameState, from: Coord, to: Coord, horizontalFirst: boolean): CommandOutcome {
  const path = roadPath(from, to, horizontalFirst);
  if (!path.every((tile) => isInsideOwnedParcels(state, tile))) return fail('error.outsideOwnedParcels');
  const blocked = occupiedTiles(state);
  const missing = missingRoadTiles(state, path);
  if (missing.some((tile) => blocked.has(tileKey(tile)))) return fail('error.tilesOccupied');
  const cost = roadBuildCost(state, path);
  if (state.urbs < cost) return fail('error.notEnoughUrbs');
  return {
    state: { ...state, urbs: state.urbs - cost, roads: [...state.roads, ...missing.map((tile) => ({ ...tile, kind: 'road' as const }))] },
    events: [{ type: 'RoadBuilt', tiles: missing.length }],
  };
}

function placeCrossing(state: GameState, tile: Coord): CommandOutcome {
  const road = state.roads.find((candidate) => candidate.x === tile.x && candidate.y === tile.y);
  if (!road) return fail('error.noRoadHere');
  const exits = roadExits(state, tile);
  const isStraight = exits.length === 2 && ((exits.includes('E') && exits.includes('W')) || (exits.includes('N') && exits.includes('S')));
  if (road.kind === 'crossing' || !isStraight) return fail('error.invalidCrossing');
  if (state.urbs < GAME_CONFIG.crossingCost) return fail('error.notEnoughUrbs');
  return {
    state: {
      ...state,
      urbs: state.urbs - GAME_CONFIG.crossingCost,
      roads: state.roads.map((candidate) => (candidate === road ? { ...candidate, kind: 'crossing' as const } : candidate)),
    },
    events: [],
  };
}

function placeRoundabout(state: GameState, center: Coord): CommandOutcome {
  const tiles = roundaboutTiles(center);
  if (!tiles.every((tile) => isInsideOwnedParcels(state, tile))) return fail('error.outsideOwnedParcels');
  const occupied = occupiedTiles(state);
  if (tiles.some((tile) => occupied.has(tileKey(tile)))) return fail('error.tilesOccupied');
  if (state.urbs < GAME_CONFIG.roundaboutCost) return fail('error.notEnoughUrbs');
  return {
    state: { ...state, urbs: state.urbs - GAME_CONFIG.roundaboutCost, roundabouts: [...state.roundabouts, center] },
    events: [],
  };
}

function demolishRoad(state: GameState, tile: Coord): CommandOutcome {
  const roundabout = state.roundabouts.find((center) => roundaboutTiles(center).some((t) => t.x === tile.x && t.y === tile.y));
  const road = state.roads.find((candidate) => candidate.x === tile.x && candidate.y === tile.y);
  if (!road && !roundabout) return fail('error.noRoadHere');
  const next: GameState = {
    ...state,
    roads: road ? state.roads.filter((candidate) => candidate !== road) : state.roads,
    roundabouts: !road && roundabout ? state.roundabouts.filter((center) => center !== roundabout) : state.roundabouts,
  };
  const orphaned = next.buildings.some(
    (building) => BUILDING_SPECS[building.type].requiresRoad && !frontTouchesRoad(next, building.type, building.x, building.y, building.rotation, building.tier),
  );
  if (orphaned) return fail('error.lastRoadOfBuilding');
  return { state: next, events: [] };
}

function placeBuilding(state: GameState, type: BuildingType, x: number, y: number, requestedRotation?: Rotation): CommandOutcome {
  const rotation = requestedRotation ?? autoRotation(state, type, x, y);
  const issue = placementIssue(state, type, x, y, rotation);
  if (issue) return fail(issue);
  const building = createBuilding(state.nextId, type, x, y, rotation);
  const utilityIssue = type === 'home' ? utilityIssueFor(state, tierDemand(1)) : null;
  if (utilityIssue) return fail(utilityIssue);
  return {
    state: { ...state, urbs: state.urbs - placementCost(type), nextId: state.nextId + 1, buildings: [...state.buildings, building] },
    events: [{ type: 'BuildingPlaced', id: building.id }],
  };
}

function sellBuilding(state: GameState, id: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === id);
  if (!building) return fail('error.unknownBuilding');
  if (building.type === 'storehouse' && !isStorageEmpty(state.storage)) return fail('error.storehouseNotEmpty');
  if ((building.type === 'powerPlant' || building.type === 'waterTower') && !canLoseUtility(state, building.type)) return fail('error.utilityInUse');
  const refund = Math.floor(placementCost(building.type) * GAME_CONFIG.sellRefundRatio);
  return {
    state: { ...state, urbs: state.urbs + refund, storehouseLevel: building.type === 'storehouse' ? 0 : state.storehouseLevel, buildings: state.buildings.filter((candidate) => candidate !== building) },
    events: [{ type: 'BuildingSold', id }],
  };
}

function moveBuilding(state: GameState, id: number, x: number, y: number, requestedRotation: Rotation | undefined, now: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === id);
  if (!building) return fail('error.unknownBuilding');
  const without: GameState = { ...state, buildings: state.buildings.filter((candidate) => candidate !== building) };
  const rotation = requestedRotation ?? autoRotation(without, building.type, x, y, building.tier);
  const issue = placementIssue(without, building.type, x, y, rotation, { isMove: true, tier: building.tier });
  if (issue) return fail(issue);
  return {
    state: { ...state, buildings: state.buildings.map((candidate) => (candidate === building ? restartRunningProduction({ ...building, x, y, rotation }, now) : candidate)) },
    events: [{ type: 'BuildingMoved', id }],
  };
}

function queueProduction(state: GameState, buildingId: number, item: string, now: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return fail('error.unknownBuilding');
  if (!(isMaterial(item) || isGood(item)) || !producibleItems(building.type).includes(item)) return fail('error.cannotProduce');
  if (!isItemUnlocked(state, item)) return fail('error.itemLocked');
  if (building.queue.length >= building.slotCount) return fail('error.queueFull');
  const materials = { ...state.storage.materials };
  for (const [material, needed] of Object.entries(recipeOf(item))) {
    const available = materials[material as keyof typeof materials] ?? 0;
    if (available < needed) return fail('error.missingMaterials');
    materials[material as keyof typeof materials] = available - needed;
  }
  const entry = newQueueEntry(item, now, isIdle(building));
  return {
    state: {
      ...state,
      storage: { ...state.storage, materials },
      buildings: state.buildings.map((candidate) => (candidate === building ? { ...building, queue: [...building.queue, entry] } : candidate)),
    },
    events: [],
  };
}

function collect(state: GameState, buildingId: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return fail('error.unknownBuilding');
  if (building.type === 'shop') return collectShopEarnings(state, building);
  if (building.type === 'home') return collectTax(state, building);
  if (!building.queue.some((entry) => entry.done)) return fail('error.nothingToCollect');
  if (!hasStorehouse(state)) return fail('error.noStorehouse');

  const capacity = storageCapacity(state);
  const used = storageUsed(state.storage);
  const materials = { ...state.storage.materials };
  const goods = { ...state.storage.goods };
  const remaining: QueueEntry[] = [];
  let collected = 0;
  for (const entry of building.queue) {
    const compartment = isMaterial(entry.item) ? 'materials' : 'goods';
    if (!entry.done || used[compartment] >= capacity[compartment]) {
      remaining.push(entry);
      continue;
    }
    if (isMaterial(entry.item)) materials[entry.item] = (materials[entry.item] ?? 0) + 1;
    else goods[entry.item] = (goods[entry.item] ?? 0) + 1;
    used[compartment] += 1;
    collected += 1;
  }
  if (collected === 0) return fail('error.storageFull');
  const events: GameEvent[] = [{ type: 'ItemsCollected', buildingId }];
  if (remaining.some((entry) => entry.done)) events.push({ type: 'StorageFull', buildingId });
  return {
    state: {
      ...state,
      storage: { materials, goods },
      marketUnlocked: state.marketUnlocked || Object.values(goods).some((amount) => (amount ?? 0) > 0),
      buildings: state.buildings.map((candidate) => (candidate === building ? { ...building, queue: remaining } : candidate)),
    },
    events,
  };
}

function buySlot(state: GameState, buildingId: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return fail('error.unknownBuilding');
  if (BUILDING_SPECS[building.type].initialSlots === 0) return fail('error.cannotProduce');
  if (building.slotCount >= MAX_SLOTS) return fail('error.maxSlots');
  const price = SLOT_PRICES[building.slotCount + 1] ?? 0;
  if (state.urbs < price) return fail('error.notEnoughUrbs');
  return {
    state: {
      ...state,
      urbs: state.urbs - price,
      buildings: state.buildings.map((candidate) => (candidate === building ? { ...building, slotCount: building.slotCount + 1, stacks: building.type === 'shop' ? [...building.stacks, emptyStack()] : building.stacks } : candidate)),
    },
    events: [],
  };
}

function upgradeStorehouse(state: GameState): CommandOutcome {
  if (!hasStorehouse(state)) return fail('error.noStorehouse');
  const cost = STORAGE_UPGRADE_COSTS[state.storehouseLevel];
  if (cost === undefined) return fail('error.maxLevel');
  if (state.urbs < cost) return fail('error.notEnoughUrbs');
  return { state: { ...state, urbs: state.urbs - cost, storehouseLevel: state.storehouseLevel + 1 }, events: [] };
}

function collectShopEarnings(state: GameState, building: Building): CommandOutcome {
  const earned = building.stacks.reduce((total, stack) => total + stack.earned, 0);
  if (earned === 0) return fail('error.nothingToCollect');
  return {
    state: {
      ...state,
      urbs: state.urbs + earned,
      buildings: state.buildings.map((candidate) =>
        candidate === building ? { ...building, stacks: building.stacks.map((stack) => ({ ...stack, earned: 0 })) } : candidate,
      ),
    },
    events: [{ type: 'ItemsCollected', buildingId: building.id }],
  };
}

function stockShop(state: GameState, buildingId: number, good: GoodId, now: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return fail('error.unknownBuilding');
  if (building.type !== 'shop' || !(good in GOODS)) return fail('error.notAShop');
  const slotIndex = building.stacks.findIndex((stack) => stack.stock === 0);
  if (slotIndex === -1) return fail('error.queueFull');
  const available = state.storage.goods[good] ?? 0;
  if (available < SHOP.stackSize) return fail('error.missingGoods');
  const stacks = building.stacks.map((stack, index) =>
    index === slotIndex ? { ...stack, good, stock: SHOP.stackSize, nextSaleAt: now + SHOP.saleIntervalMs } : stack,
  );
  return {
    state: {
      ...state,
      storage: { ...state.storage, goods: { ...state.storage.goods, [good]: available - SHOP.stackSize } },
      buildings: state.buildings.map((candidate) => (candidate === building ? { ...building, stacks } : candidate)),
    },
    events: [],
  };
}

function sellToMarket(state: GameState, good: GoodId, quantity: number, now: number): CommandOutcome {
  if (!state.marketUnlocked) return fail('error.marketLocked');
  if (!Number.isInteger(quantity) || quantity <= 0 || !(good in GOODS)) return fail('error.invalidQuantity');
  const available = state.storage.goods[good] ?? 0;
  if (available < quantity) return fail('error.missingGoods');
  const quote = marketQuote(state, good, quantity, now);
  return {
    state: {
      ...state,
      urbs: state.urbs + quote.total,
      storage: { ...state.storage, goods: { ...state.storage.goods, [good]: available - quantity } },
      market: { ...state.market, [good]: { points: quote.endPoints, updatedAt: now } },
    },
    events: [],
  };
}

function buyParcel(state: GameState, parcel: Coord): CommandOutcome {
  if (!isInsideMap(parcel)) return fail('error.outsideMap');
  if (isOwned(state, parcel)) return fail('error.parcelOwned');
  if (!isAdjacentToOwned(state, parcel)) return fail('error.parcelNotAdjacent');
  const price = parcelPrice(state);
  if (state.urbs < price) return fail('error.notEnoughUrbs');
  return { state: { ...state, urbs: state.urbs - price, ownedParcels: [...state.ownedParcels, parcel] }, events: [] };
}

function tierDemand(tier: number): UtilityTotals {
  const spec = HOME_TIERS[tier - 1];
  return { power: spec?.power ?? 0, water: spec?.water ?? 0 };
}

function utilityIssueFor(state: GameState, extra: UtilityTotals): ErrorKey | null {
  const capacity = utilityCapacity(state);
  const demand = utilityDemand(state);
  if (demand.power + extra.power > capacity.power) return 'error.notEnoughPower';
  if (demand.water + extra.water > capacity.water) return 'error.notEnoughWater';
  return null;
}

function canLoseUtility(state: GameState, type: 'powerPlant' | 'waterTower'): boolean {
  const remaining: GameState = { ...state, buildings: state.buildings.filter((candidate, index, all) => candidate.type !== type || index !== all.findIndex((b) => b.type === type)) };
  const capacity = utilityCapacity(remaining);
  const demand = utilityDemand(remaining);
  return type === 'powerPlant' ? capacity.power >= demand.power : capacity.water >= demand.water;
}

function collectTax(state: GameState, building: Building): CommandOutcome {
  const due = taxDue(building);
  if (due === 0) return fail('error.nothingToCollect');
  const remainder = building.taxCitizenMs - due * TAX.hourMs;
  return {
    state: {
      ...state,
      urbs: state.urbs + due,
      buildings: state.buildings.map((candidate) => (candidate === building ? { ...building, taxCitizenMs: remainder } : candidate)),
    },
    events: [{ type: 'ItemsCollected', buildingId: building.id }],
  };
}

function upgradeHome(state: GameState, buildingId: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return fail('error.unknownBuilding');
  if (building.type !== 'home') return fail('error.notAHome');
  if (building.tier >= MAX_HOME_TIER) return fail('error.maxTier');
  const nextTier = building.tier + 1;
  const footprintIssue = placementIssue(state, 'home', building.x, building.y, building.rotation, {
    ignoreBuildingId: building.id,
    isMove: true,
    tier: nextTier,
  });
  if (footprintIssue) return fail(footprintIssue);

  const cost = HOME_UPGRADE_COSTS[nextTier];
  if (!cost) return fail('error.maxTier');
  if (state.urbs < cost.urbs) return fail('error.notEnoughUrbs');
  const goods = { ...state.storage.goods };
  for (const [good, amount] of Object.entries(cost.goods)) {
    const available = goods[good as GoodId] ?? 0;
    if (available < amount) return fail('error.missingGoods');
    goods[good as GoodId] = available - amount;
  }
  const before = tierDemand(building.tier);
  const after = tierDemand(nextTier);
  const utilityIssue = utilityIssueFor(state, { power: after.power - before.power, water: after.water - before.water });
  if (utilityIssue) return fail(utilityIssue);

  return {
    state: {
      ...state,
      urbs: state.urbs - cost.urbs,
      storage: { ...state.storage, goods },
      buildings: state.buildings.map((candidate) => (candidate === building ? { ...building, tier: nextTier } : candidate)),
    },
    events: [{ type: 'HomeUpgraded', buildingId, tier: nextTier }],
  };
}
