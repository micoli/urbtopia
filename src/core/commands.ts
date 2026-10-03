import { ECOLOGY, ECOLOGY_UNLOCKS, citizenCount } from './ecology';
import { routeForLine } from './transport';
import { BUILDING_SPECS, createBuilding, emptyStack, placementCost } from './buildingSpecs';
import { advance } from './advance';
import { GAME_CONFIG } from './config';
import type { Coord } from './coord';
import type { GameEvent } from './events';
import { tileKey } from './geometry';
import { utilityCapacity, utilityDemand, type UtilityTotals } from './city';
import { HOME_TIERS, MAX_SLOTS, SHOP, TAX, SLOT_PRICES } from './economy';
import { GOODS, isGood, isMaterial, minTierOf, producibleItems, recipeOf, type GoodId } from './items';
import { marketQuote } from './market';
import { isItemUnlocked } from './unlocks';
import { withStartingCity } from './newGame';
import { tutorialAllows, tutorialSkipMs } from './tutorial';
import { isAdjacentToOwned, isInsideMap, isOwned, parcelPrice } from './parcels';
import { isInsideOwnedParcels, occupiedTiles, roadExits, roundaboutTiles } from './occupancy';
import { autoRotation, frontTouchesRoad, placementIssue } from './placement';
import { newQueueEntry, restartRunningProduction, shiftRunningTimers, taxDue } from './production';
import { roadBuildCost, missingRoadTiles } from './roadCost';
import { roadPath } from './roads';
import { maxTierOf, productionTierOf, upgradeCostOf } from './tiers';
import { canRemoveStorage, hasStorage, isStorageType, storageCapacity, storageUsed } from './storage';
import type { Building, BuildingType, GameState, QueueEntry, Rotation } from './state';

const HOUR_MS = 60 * 60 * 1000;

export type Command =
  | { readonly type: 'BuildRoad'; readonly from: Coord; readonly to: Coord; readonly horizontalFirst?: boolean }
  | { readonly type: 'PlaceCrossing'; readonly x: number; readonly y: number }
  | { readonly type: 'PlaceRoundabout'; readonly x: number; readonly y: number }
  | { readonly type: 'DemolishRoad'; readonly x: number; readonly y: number }
  | { readonly type: 'DemolishRoadPath'; readonly from: Coord; readonly to: Coord; readonly horizontalFirst?: boolean }
  | { readonly type: 'PlaceBuilding'; readonly buildingType: BuildingType; readonly x: number; readonly y: number; readonly rotation?: Rotation; readonly solar?: boolean }
  | { readonly type: 'EquipHome'; readonly buildingId: number; readonly equipment: 'solar' | 'insulation' }
  | { readonly type: 'SetBusLine'; readonly id?: number; readonly stops: number[] }
  | { readonly type: 'DeleteBusLine'; readonly id: number }
  | { readonly type: 'DismissEcology' }
  | { readonly type: 'QueueProduction'; readonly buildingId: number; readonly item: string }
  | { readonly type: 'Collect'; readonly buildingId: number }
  | { readonly type: 'StockShop'; readonly buildingId: number; readonly good: GoodId }
  | { readonly type: 'SellToMarket'; readonly good: GoodId; readonly quantity: number }
  | { readonly type: 'UpgradeBuilding'; readonly buildingId: number }
  | { readonly type: 'BuyParcel'; readonly x: number; readonly y: number }
  | { readonly type: 'BuySlot'; readonly buildingId: number }
  | { readonly type: 'SellBuilding'; readonly id: number }
  | { readonly type: 'MoveBuilding'; readonly id: number; readonly x: number; readonly y: number; readonly rotation?: Rotation }
  | { readonly type: 'SkipTime'; readonly hours: number }
  | { readonly type: 'SkipTutorialStep' }
  | { readonly type: 'SkipTutorial' };

export type ErrorKey =
  | 'error.unknownCommand'
  | 'error.unknownBuilding'
  | 'error.outsideOwnedParcels'
  | 'error.tilesOccupied'
  | 'error.needsRoad'
  | 'error.storehouseExists'
  | 'error.siloExists'
  | 'error.vaultExists'
  | 'error.notEnoughUrbs'
  | 'error.lastRoadOfBuilding'
  | 'error.noRoadHere'
  | 'error.invalidCrossing'
  | 'error.cannotProduce'
  | 'error.queueFull'
  | 'error.nothingToCollect'
  | 'error.noStorehouse'
  | 'error.storageFull'
  | 'error.storageInUse'
  | 'error.missingMaterials'
  | 'error.maxSlots'
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
  | 'error.tierTooLow'
  | 'error.maxTier'
  | 'error.tutorialLocked'
  | 'error.nothingToSkip'
  | 'error.invalidBusLine'
  | 'error.alreadyEquipped';

export interface CommandError {
  key: ErrorKey;
}

export type CommandOutcome = { state: GameState; events: GameEvent[] } | CommandError;

export function isError(outcome: CommandOutcome): outcome is CommandError {
  return 'key' in outcome;
}

const fail = (key: ErrorKey): CommandError => ({ key });

export function handleCommand(state: GameState, command: Command, now: number): CommandOutcome {
  if (!tutorialAllows(state, command)) return fail('error.tutorialLocked');
  switch (command.type) {
    case 'BuildRoad':
      return buildRoad(state, command.from, command.to, command.horizontalFirst ?? true);
    case 'PlaceCrossing':
      return placeCrossing(state, { x: command.x, y: command.y });
    case 'PlaceRoundabout':
      return placeRoundabout(state, { x: command.x, y: command.y });
    case 'DemolishRoad':
      return demolishRoad(state, [{ x: command.x, y: command.y }]);
    case 'DemolishRoadPath':
      return demolishRoad(state, roadPath(command.from, command.to, command.horizontalFirst ?? true));
    case 'PlaceBuilding':
      return placeBuilding(state, command.buildingType, command.x, command.y, command.rotation, command.solar);
    case 'EquipHome':
      return equipHome(state, command.buildingId, command.equipment);
    case 'SetBusLine':
      return setBusLine(state, command.id, command.stops);
    case 'DeleteBusLine':
      return { state: { ...state, busLines: (state.busLines ?? []).filter(line => line.id !== command.id) }, events: [] };
    case 'DismissEcology':
      return { state: { ...state, ecologyDismissed: true }, events: [] };
    case 'QueueProduction':
      return queueProduction(state, command.buildingId, command.item, now);
    case 'Collect':
      return collect(state, command.buildingId);
    case 'StockShop':
      return stockShop(state, command.buildingId, command.good, now);
    case 'SellToMarket':
      return sellToMarket(state, command.good, command.quantity, now);
    case 'UpgradeBuilding':
      return upgradeBuilding(state, command.buildingId);
    case 'BuyParcel':
      return buyParcel(state, { x: command.x, y: command.y });
    case 'BuySlot':
      return buySlot(state, command.buildingId);
    case 'SellBuilding':
      return sellBuilding(state, command.id);
    case 'MoveBuilding':
      return moveBuilding(state, command.id, command.x, command.y, command.rotation, now);
    case 'SkipTime':
      return skipTime(state, command.hours, now);
    case 'SkipTutorialStep':
      return skipTutorialStep(state, now);
    case 'SkipTutorial':
      return skipTutorial(state);
    default:
      return fail('error.unknownCommand');
  }
}

function skipTime(state: GameState, hours: number, now: number): CommandOutcome {
  if (!Number.isFinite(hours) || hours <= 0 || hours * HOUR_MS > Number.MAX_SAFE_INTEGER) return fail('error.invalidQuantity');
  return skipMs(state, hours * HOUR_MS, now);
}

function skipTutorialStep(state: GameState, now: number): CommandOutcome {
  const skippedMs = tutorialSkipMs(state, now);
  if (skippedMs === null) return fail('error.nothingToSkip');
  return skipMs(state, skippedMs, now);
}

function skipTutorial(state: GameState): CommandOutcome {
  if (state.tutorial === null) return { state, events: [] };
  const untouched = state.buildings.length === 0 && state.roads.length === 0;
  return { state: untouched ? withStartingCity(state) : { ...state, tutorial: null }, events: [] };
}

function skipMs(state: GameState, skippedMs: number, now: number): CommandOutcome {
  const earlier = { ...shiftRunningTimers(state, -skippedMs), lastSeen: state.lastSeen - skippedMs, ...(state.adaptationUntil === undefined ? {} : { adaptationUntil: state.adaptationUntil - skippedMs }), timeOffset: (state.timeOffset ?? 0) + skippedMs };
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

function demolishRoad(state: GameState, tiles: Coord[]): CommandOutcome {
  const isTarget = (candidate: Coord) => tiles.some((tile) => tile.x === candidate.x && tile.y === candidate.y);
  const roundabouts = state.roundabouts.filter((center) => roundaboutTiles(center).some(isTarget));
  const roads = state.roads.filter(isTarget);
  if (roads.length === 0 && roundabouts.length === 0) return fail('error.noRoadHere');
  const next: GameState = {
    ...state,
    roads: state.roads.filter((candidate) => !roads.includes(candidate)),
    roundabouts: state.roundabouts.filter((center) => !roundabouts.includes(center)),
  };
  const orphaned = next.buildings.some(
    (building) => building.type !== 'busStop' && BUILDING_SPECS[building.type].requiresRoad && !frontTouchesRoad(next, building.type, building.x, building.y, building.rotation, building.tier),
  );
  if (orphaned) return fail('error.lastRoadOfBuilding');
  return { state: next, events: [] };
}

function placeBuilding(state: GameState, type: BuildingType, x: number, y: number, requestedRotation?: Rotation, solar = false): CommandOutcome {
  if (citizenCount(state) < (ECOLOGY_UNLOCKS[type] ?? 0) || (solar && citizenCount(state) < 15)) return fail('error.itemLocked');
  if (solar && type !== 'home') return fail('error.cannotProduce');
  const extraCost = solar ? ECOLOGY.solarCost : 0;
  const rotation = requestedRotation ?? autoRotation(state, type, x, y);
  const issue = placementIssue(state, type, x, y, rotation);
  if (issue) return fail(issue);
  if (state.urbs < placementCost(type) + extraCost) return fail('error.notEnoughUrbs');
  const building = { ...createBuilding(state.nextId, type, x, y, rotation), ...(solar ? { solar: true } : {}), ...(type === 'battery' ? { storedEnergy: 0 } : {}) };
  const utilityIssue = type === 'home' ? utilityIssueFor(state, tierDemand(1)) : null;
  if (utilityIssue) return fail(utilityIssue);
  return {
    state: { ...state, urbs: state.urbs - placementCost(type) - extraCost, nextId: state.nextId + 1, buildings: [...state.buildings, building] },
    events: [{ type: 'BuildingPlaced', id: building.id }],
  };
}

function sellBuilding(state: GameState, id: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === id);
  if (!building) return fail('error.unknownBuilding');
  if (isStorageType(building.type) && !canRemoveStorage(state, building.id)) return fail('error.storageInUse');
  if ((building.type === 'powerPlant' || building.type === 'waterTower') && !canLoseUtility(state, building)) return fail('error.utilityInUse');
  const refund = Math.floor(placementCost(building.type) * GAME_CONFIG.sellRefundRatio);
  return {
    state: { ...state, urbs: state.urbs + refund, buildings: state.buildings.filter((candidate) => candidate !== building) },
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
  if (building.tier < minTierOf(item)) return fail('error.tierTooLow');
  if (building.queue.length >= building.slotCount) return fail('error.queueFull');
  const materials = { ...state.storage.materials };
  for (const [material, needed] of Object.entries(recipeOf(item))) {
    const available = materials[material as keyof typeof materials] ?? 0;
    if (available < needed) return fail('error.missingMaterials');
    materials[material as keyof typeof materials] = available - needed;
  }
  const entry = newQueueEntry(building, item, now);
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
  if (!hasStorage(state)) return fail('error.noStorehouse');

  const capacity = storageCapacity(state);
  const used = storageUsed(state.storage);
  const materials = { ...state.storage.materials };
  const goods = { ...state.storage.goods };
  const remaining: QueueEntry[] = [];
  let collected = 0;
  for (const entry of building.queue) {
    const compartment = isMaterial(entry.item) ? 'materials' : 'goods';
    if (!entry.done || used[compartment] + entry.quantity > capacity[compartment]) {
      remaining.push(entry);
      continue;
    }
    if (isMaterial(entry.item)) materials[entry.item] = (materials[entry.item] ?? 0) + entry.quantity;
    else goods[entry.item] = (goods[entry.item] ?? 0) + entry.quantity;
    used[compartment] += entry.quantity;
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

function maxSlotsOf(building: Building): number {
  return building.type === 'shop' ? MAX_SLOTS : productionTierOf(building).maxSlots;
}

function buySlot(state: GameState, buildingId: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return fail('error.unknownBuilding');
  if (BUILDING_SPECS[building.type].initialSlots === 0) return fail('error.cannotProduce');
  if (building.slotCount >= maxSlotsOf(building)) return fail('error.maxSlots');
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

  if (demand.water + extra.water > capacity.water) return 'error.notEnoughWater';
  return null;
}

function canLoseUtility(state: GameState, sold: Building): boolean {
  const remaining: GameState = { ...state, buildings: state.buildings.filter((candidate) => candidate !== sold) };
  const capacity = utilityCapacity(remaining);
  const demand = utilityDemand(remaining);
  return sold.type === 'powerPlant' || capacity.water >= demand.water;
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

function upgradeBuilding(state: GameState, buildingId: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return fail('error.unknownBuilding');
  if (building.tier >= maxTierOf(building.type)) return fail('error.maxTier');
  const nextTier = building.tier + 1;
  const cost = upgradeCostOf(building.type, nextTier);
  if (!cost) return fail('error.maxTier');
  const isHome = building.type === 'home';
  if (isHome) {
    const footprintIssue = placementIssue(state, 'home', building.x, building.y, building.rotation, {
      ignoreBuildingId: building.id,
      isMove: true,
      tier: nextTier,
    });
    if (footprintIssue) return fail(footprintIssue);
  }

  if (state.urbs < cost.urbs) return fail('error.notEnoughUrbs');
  const goods = { ...state.storage.goods };
  for (const [good, amount] of Object.entries(cost.goods)) {
    const available = goods[good as GoodId] ?? 0;
    if (available < amount) return fail('error.missingGoods');
    goods[good as GoodId] = available - amount;
  }
  if (isHome) {
    const before = tierDemand(building.tier);
    const after = tierDemand(nextTier);
    const utilityIssue = utilityIssueFor(state, { power: after.power - before.power, water: after.water - before.water });
    if (utilityIssue) return fail(utilityIssue);
  }

  return {
    state: {
      ...state,
      urbs: state.urbs - cost.urbs,
      storage: { ...state.storage, goods },
      buildings: state.buildings.map((candidate) => (candidate === building ? { ...building, tier: nextTier } : candidate)),
    },
    events: [{ type: 'BuildingUpgraded', buildingId, tier: nextTier }],
  };
}

function equipHome(state: GameState, id: number, equipment: 'solar' | 'insulation'): CommandOutcome {
  const home = state.buildings.find(b => b.id === id);
  if (!home || home.type !== 'home') return fail('error.unknownBuilding');
  const field = equipment === 'solar' ? 'solar' : 'insulated';
  if (home[field]) return fail('error.alreadyEquipped');
  if (citizenCount(state) < (equipment === 'solar' ? 15 : 6)) return fail('error.itemLocked');
  const cost = (equipment === 'solar' ? ECOLOGY.solarCost : ECOLOGY.insulationCost) * home.tier;
  if (state.urbs < cost) return fail('error.notEnoughUrbs');
  return { state: { ...state, urbs: state.urbs - cost, buildings: state.buildings.map(b => b.id === id ? { ...b, [field]: true } : b) }, events: [] };
}

function setBusLine(state: GameState, id: number | undefined, stops: number[]): CommandOutcome {
  if (citizenCount(state) < 32) return fail('error.itemLocked');
  if (id !== undefined && !(state.busLines ?? []).some(line => line.id === id)) return fail('error.invalidBusLine');
  const line = { id: id ?? state.nextId, stops };
  if (!routeForLine(state, line)) return fail('error.invalidBusLine');
  return { state: { ...state, nextId: id === undefined ? state.nextId + 1 : state.nextId, busLines: [...(state.busLines ?? []).filter(l => l.id !== line.id), line] }, events: [] };
}
