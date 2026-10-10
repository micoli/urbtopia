import { TRANSIT, extendNetwork, networkTiles, repairNetwork, validNetworkCrossings } from '../transit/transitNetwork';
import { ECOLOGY, ECOLOGY_UNLOCKS, citizenCount } from '../environment/ecology';
import { routeFailure, routeForLine } from '../transit/transport';
import { BUILDING_SPECS, createBuilding, emptyStack, placementCost } from '../buildings/buildingSpecs';
import { isRetired } from '../buildings/buildingDefinitions';
import { advance } from './advance';
import { GAME_CONFIG } from './config';
import type { Coord } from '../map/coord';
import type { GameEvent } from './events';
import { neighbour, tileKey } from '../map/geometry';
import { utilityCapacity, utilityDemand, type UtilityTotals } from '../buildings/city';
import { HOME_TIERS, SHOP, TAX, SLOT_PRICES } from '../economy/economy';
import { canSell, isShopType, saleIntervalOf, shopTierOf, slotPriceOf } from '../economy/shops';
import { GOODS, isGood, isMaterial, minTierOf, producibleItems, recipeOf, type GoodId } from '../economy/items';
import { marketQuote } from '../economy/market';
import { harvestFields, layFields, plantFields, removeFields } from '../farming/fields';
import { buySeeds, sellSeeds } from '../farming/seeds';
import { layWater } from '../water/waterTiles';
import { removeWater } from '../water/removeWater';
import { boatsOfMarina, buyBoat, sellBoat, upgradeBoat } from '../water/boats';
import { collectCatch } from '../water/fishing';
import { cancelEvent, collectTakings, scheduleEvent, hireStaff, isVenue, moveFixture, releaseStaff, repairFixture, placeFixture, removeFixture, setVenuePrice, stockShelf } from '../venues/venues';
import { bridgeAt, bridgeKeys, placeBridge, refundOf, withoutBridge } from '../water/bridges';
import type { CropId } from '../farming/crops';
import { isItemUnlocked } from '../progression/unlocks';
import { withStartingCity } from './newGame';
import { tutorialAllows, tutorialSkipMs } from '../progression/tutorial';
import { isAdjacentToOwned, isInsideMap, isOwned, parcelPrice } from '../map/parcels';
import { FACILITIES, isFacilityType } from '../services/facilities';
import { missingServices, serviceCoverage } from '../services/services';
import { isInsideOwnedParcels, occupiedTiles, roadExits, roundaboutTiles } from '../map/occupancy';
import { autoRotation, frontHasAccess, placementIssue } from '../map/placement';
import { newQueueEntry, restartRunningProduction, runningEntry, rushPrice, rushRunningProduction, shiftRunningTimers, taxDue } from '../economy/production';
import { roadBuildCost, missingRoadTiles } from '../map/roadCost';
import { roadPath } from '../map/roads';
import { roadTierUpgradeCost } from '../traffic/roadTier';
import { maxTierOf, productionTierOf, upgradeCostOf } from '../economy/tiers';
import { canRemoveStorage, compartmentOf, hasStorage, isStorageType, storageCapacity, storageUsed } from '../economy/storage';
import { abandonCasinoRound, playSlotMachine, settleBlackjack, settleBlockmatch, startCasinoRound } from '../leisure/casinoRound';
import type { BlackjackAction } from '../leisure/blackjack';
import type { FixtureId, StaffRole, BoatFamily, Building, BuildingType, BusLine, GameState, HomeColorVariant, QueueEntry, Rotation, TransitLine, TransitTile, TransitVehicleKind } from './state';

const HOUR_MS = 60 * 60 * 1000;

export type Command =
  | { readonly type: 'BuildTransit'; readonly mode: 'brt' | 'rail'; readonly from: Coord; readonly to: Coord; readonly horizontalFirst?: boolean }
  | { readonly type: 'DemolishTransit'; readonly mode: 'brt' | 'rail'; readonly from: Coord; readonly to: Coord; readonly horizontalFirst?: boolean }
  | { readonly type: 'RepairTransitNetwork'; readonly mode: 'brt' | 'rail' }
  | { readonly type: 'SetTransitLine'; readonly id?: number; readonly mode: 'brt' | 'rail'; readonly stops: number[]; readonly peakHeadway: number; readonly offPeakHeadway: number }
  | { readonly type: 'DeleteTransitLine'; readonly id: number }
  | { readonly type: 'BuyTransitVehicle'; readonly kind: TransitVehicleKind }
  | { readonly type: 'SellTransitVehicle'; readonly id: number }
  | { readonly type: 'AssignTransitVehicle'; readonly id: number; readonly lineId?: number }
  | { readonly type: 'BuildRoad'; readonly from: Coord; readonly to: Coord; readonly horizontalFirst?: boolean }
  | { readonly type: 'UpgradeRoads'; readonly tiles: readonly Coord[] }
  | { readonly type: 'PlaceCrossing'; readonly x: number; readonly y: number }
  | { readonly type: 'PlaceRoundabout'; readonly x: number; readonly y: number }
  | { readonly type: 'DemolishRoad'; readonly x: number; readonly y: number }
  | { readonly type: 'DemolishRoadPath'; readonly from: Coord; readonly to: Coord; readonly horizontalFirst?: boolean }
  | { readonly type: 'PlaceBuilding'; readonly buildingType: BuildingType; readonly x: number; readonly y: number; readonly rotation?: Rotation; readonly solar?: boolean; readonly colorVariant?: HomeColorVariant }
  | { readonly type: 'EquipHome'; readonly buildingId: number; readonly equipment: 'solar' | 'insulation' }
  | { readonly type: 'SetCoalEnabled'; readonly buildingId: number; readonly enabled: boolean }
  | { readonly type: 'SetBusLine'; readonly id?: number; readonly stops: number[] }
  | { readonly type: 'DeleteBusLine'; readonly id: number }
  | { readonly type: 'DismissEcology' }
  | { readonly type: 'LayFields'; readonly tiles: readonly Coord[] }
  | { readonly type: 'RemoveFields'; readonly tiles: readonly Coord[] }
  | { readonly type: 'LayWater'; readonly tiles: readonly Coord[] }
  | { readonly type: 'RemoveWater'; readonly tiles: readonly Coord[] }
  | { readonly type: 'BuyBoat'; readonly family: BoatFamily; readonly marinaId: number; readonly x: number; readonly y: number }
  | { readonly type: 'SellBoat'; readonly id: number }
  | { readonly type: 'PlaceBridge'; readonly x: number; readonly y: number; readonly length: number; readonly axis: 'x' | 'y' }
  | { readonly type: 'RemoveBridge'; readonly x: number; readonly y: number }
  | { readonly type: 'UpgradeBoat'; readonly id: number }
  | { readonly type: 'CollectCatch'; readonly marinaId: number }
  | { readonly type: 'Plant'; readonly crop: CropId; readonly tiles: readonly Coord[] }
  | { readonly type: 'Harvest'; readonly tiles: readonly Coord[] }
  | { readonly type: 'BuySeeds'; readonly crop: CropId; readonly quantity: number }
  | { readonly type: 'SellSeeds'; readonly crop: CropId; readonly quantity: number }
  | { readonly type: 'QueueProduction'; readonly buildingId: number; readonly item: string }
  | { readonly type: 'Collect'; readonly buildingId: number }
  | { readonly type: 'RushProduction'; readonly buildingId: number }
  | { readonly type: 'MoveFixture'; readonly buildingId: number; readonly fixtureId: number; readonly x: number; readonly y: number; readonly rotation?: Rotation }
  | { readonly type: 'HireStaff'; readonly buildingId: number; readonly role: StaffRole }
  | { readonly type: 'ReleaseStaff'; readonly buildingId: number; readonly role: StaffRole }
  | { readonly type: 'SetVenuePrice'; readonly buildingId: number; readonly price: number }
  | { readonly type: 'ScheduleEvent'; readonly buildingId: number; readonly startsInHours: number }
  | { readonly type: 'CancelEvent'; readonly buildingId: number }
  | { readonly type: 'StockShelf'; readonly buildingId: number; readonly fixtureId: number; readonly good: GoodId }
  | { readonly type: 'RepairFixture'; readonly buildingId: number; readonly fixtureId: number }
  | { readonly type: 'RemoveFixture'; readonly buildingId: number; readonly fixtureId: number }
  | { readonly type: 'PlaceFixture'; readonly buildingId: number; readonly fixture: FixtureId; readonly x: number; readonly y: number; readonly rotation?: Rotation }
  | { readonly type: 'StockShop'; readonly buildingId: number; readonly good: GoodId }
  | { readonly type: 'SellToMarket'; readonly good: GoodId; readonly quantity: number }
  | { readonly type: 'UpgradeBuilding'; readonly buildingId: number }
  | { readonly type: 'PlaySlotMachine'; readonly buildingId: number; readonly stake: number }
  | { readonly type: 'StartCasinoRound'; readonly buildingId: number; readonly game: 'blackjack' | 'blockmatch'; readonly stake: number }
  | { readonly type: 'SettleBlackjack'; readonly buildingId: number; readonly actions: readonly BlackjackAction[] }
  | { readonly type: 'SettleBlockmatch'; readonly buildingId: number; readonly stars: number }
  | { readonly type: 'AbandonCasinoRound' }
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
  | 'error.unknownFixture'
  | 'error.invalidPrice'
  | 'error.managerRequired'
  | 'error.rankTooLow'
  | 'error.nothingToRepair'
  | 'error.shelfBusy'
  | 'error.shelfFull'
  | 'error.invalidEventStart'
  | 'error.eventBusy'
  | 'error.eventCooldown'
  | 'error.eventStarted'
  | 'error.noEvent'
  | 'error.noStaffPost'
  | 'error.noStaffToRelease'
  | 'error.outsideOwnedParcels'
  | 'error.tilesOccupied'
  | 'error.homeExpansionBlocked'
  | 'error.casinoExpansionBlocked'
  | 'error.casinoShut'
  | 'error.invalidStake'
  | 'error.noOpenRound'
  | 'error.invalidRound'
  | 'error.needsRoad'
  | 'error.needsRoadOrBrt'
  | 'error.storehouseExists'
  | 'error.siloExists'
  | 'error.vaultExists'
  | 'error.grainSiloExists'
  | 'error.farmExists'
  | 'error.packhouseExists'
  | 'error.noFarm'
  | 'error.fieldCapReached'
  | 'error.noFieldHere'
  | 'error.noWaterHere'
  | 'error.needsWater'
  | 'error.bridgeNeedsWater'
  | 'error.bridgeNeedsRoad'
  | 'error.bridgeTile'
  | 'error.noBridgeHere'
  | 'error.notOnMarinaWater'
  | 'error.marinaFull'
  | 'error.marinaInUse'
  | 'error.unknownBoat'
  | 'error.waterInUse'
  | 'error.noSeeds'
  | 'error.nothingToPlant'
  | 'error.seedStockFull'
  | 'error.townHallExists'
  | 'error.serviceRequired'
  | 'error.notEnoughUrbs'
  | 'error.lastAccessOfBuilding'
  | 'error.noRoadHere'
  | 'error.invalidCrossing'
  | 'error.maxRoadTier'
  | 'error.networkIntact'
  | 'error.cannotProduce'
  | 'error.queueFull'
  | 'error.nothingToRush'
  | 'error.nothingToCollect'
  | 'error.noStorehouse'
  | 'error.storageFull'
  | 'error.storageInUse'
  | 'error.missingMaterials'
  | 'error.maxSlots'
  | 'error.notAShop'
  | 'error.notSoldHere'
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
  | 'error.stopNotOnNetwork'
  | 'error.networkNotConnected'
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
    case 'BuildTransit':
    case 'DemolishTransit':
    case 'RepairTransitNetwork':
    case 'SetTransitLine':
    case 'DeleteTransitLine':
    case 'BuyTransitVehicle':
    case 'SellTransitVehicle':
    case 'AssignTransitVehicle':
      return transitCommand(state, command);
    case 'BuildRoad':
      return buildRoad(state, command.from, command.to, command.horizontalFirst ?? true);
    case 'UpgradeRoads':
      return upgradeRoads(state, command.tiles);
    case 'PlaceCrossing':
      return placeCrossing(state, { x: command.x, y: command.y });
    case 'PlaceRoundabout':
      return placeRoundabout(state, { x: command.x, y: command.y });
    case 'DemolishRoad':
      return demolishRoad(state, [{ x: command.x, y: command.y }]);
    case 'DemolishRoadPath':
      return demolishRoad(state, roadPath(command.from, command.to, command.horizontalFirst ?? true));
    case 'PlaceBuilding':
      return placeBuilding(state, command.buildingType, command.x, command.y, command.rotation, command.solar, command.colorVariant);
    case 'EquipHome':
      return equipHome(state, command.buildingId, command.equipment);
    case 'SetCoalEnabled':
      return setCoalEnabled(state, command.buildingId, command.enabled);
    case 'SetBusLine':
      return setBusLine(state, command.id, command.stops);
    case 'DeleteBusLine':
      return { state: { ...state, busLines: (state.busLines ?? []).filter(line => line.id !== command.id) }, events: [] };
    case 'DismissEcology':
      return { state: { ...state, ecologyDismissed: true }, events: [] };
    case 'LayFields':
      return layFields(state, command.tiles);
    case 'RemoveFields':
      return removeFields(state, command.tiles);
    case 'LayWater':
      return layWater(state, command.tiles);
    case 'RemoveWater':
      return removeWater(state, command.tiles);
    case 'BuyBoat':
      return buyBoat(state, command.family, command.marinaId, { x: command.x, y: command.y });
    case 'SellBoat':
      return sellBoat(state, command.id);
    case 'PlaceBridge':
      return placeBridge(state, { x: command.x, y: command.y, length: command.length, axis: command.axis });
    case 'RemoveBridge':
      return removeBridge(state, { x: command.x, y: command.y });
    case 'UpgradeBoat':
      return upgradeBoat(state, command.id);
    case 'CollectCatch':
      return collectCatch(state, command.marinaId);
    case 'Plant':
      return plantFields(state, command.crop, command.tiles);
    case 'Harvest':
      return harvestFields(state, command.tiles);
    case 'BuySeeds':
      return buySeeds(state, command.crop, command.quantity);
    case 'SellSeeds':
      return sellSeeds(state, command.crop, command.quantity);
    case 'QueueProduction':
      return queueProduction(state, command.buildingId, command.item, now);
    case 'RushProduction':
      return rushProduction(state, command.buildingId, now);
    case 'Collect':
      return collect(state, command.buildingId);
    case 'MoveFixture':
      return moveFixture(state, command.buildingId, command.fixtureId, command.x, command.y, command.rotation);
    case 'HireStaff':
      return hireStaff(state, command.buildingId, command.role);
    case 'ReleaseStaff':
      return releaseStaff(state, command.buildingId, command.role);
    case 'SetVenuePrice':
      return setVenuePrice(state, command.buildingId, command.price);
    case 'ScheduleEvent':
      return scheduleEvent(state, command.buildingId, command.startsInHours);
    case 'CancelEvent':
      return cancelEvent(state, command.buildingId);
    case 'StockShelf':
      return stockShelf(state, command.buildingId, command.fixtureId, command.good);
    case 'RepairFixture':
      return repairFixture(state, command.buildingId, command.fixtureId);
    case 'RemoveFixture':
      return removeFixture(state, command.buildingId, command.fixtureId);
    case 'PlaceFixture':
      return placeFixture(state, command.buildingId, command.fixture, command.x, command.y, command.rotation ?? 0);
    case 'StockShop':
      return stockShop(state, command.buildingId, command.good, now);
    case 'SellToMarket':
      return sellToMarket(state, command.good, command.quantity, now);
    case 'UpgradeBuilding':
      return upgradeBuilding(state, command.buildingId);
    case 'PlaySlotMachine':
      return playSlotMachine(state, command.buildingId, command.stake);
    case 'StartCasinoRound':
      return startCasinoRound(state, command.buildingId, command.game, command.stake);
    case 'SettleBlackjack':
      return settleBlackjack(state, command.buildingId, command.actions);
    case 'SettleBlockmatch':
      return settleBlockmatch(state, command.buildingId, command.stars);
    case 'AbandonCasinoRound':
      return abandonCasinoRound(state);
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
  const dedicated = new Set([...(state.brtRoads ?? []), ...(state.rails ?? [])].map(tileKey));
  if (missing.some((tile) => blocked.has(tileKey(tile)) && !dedicated.has(tileKey(tile)))) return fail('error.tilesOccupied');
  const cost = roadBuildCost(state, path);
  if (state.urbs < cost) return fail('error.notEnoughUrbs');
  const proposed = { ...state, roads: [...state.roads, ...missing.map(tile => ({ ...tile, kind: 'road' as const }))] };
  if (!validNetworkCrossings(proposed)) return fail('error.invalidCrossing');
  return {
    state: { ...state, urbs: state.urbs - cost, roads: [...state.roads, ...missing.map((tile) => ({ ...tile, kind: 'road' as const }))] },
    events: [{ type: 'RoadBuilt', tiles: missing.length }],
  };
}

function upgradeRoads(state: GameState, tiles: readonly Coord[]): CommandOutcome {
  const targets = new Set(tiles.map(tileKey));
  const roads = state.roads.filter((road) => targets.has(tileKey(road)));
  if (roads.length === 0) return fail('error.noRoadHere');
  const upgradable = roads.filter((road) => roadTierUpgradeCost(road.tier ?? 1) !== null);
  if (upgradable.length === 0) return fail('error.maxRoadTier');
  const total = upgradable.reduce((sum, road) => sum + (roadTierUpgradeCost(road.tier ?? 1) ?? 0), 0);
  if (state.urbs < total) return fail('error.notEnoughUrbs');
  return {
    state: { ...state, urbs: state.urbs - total, roads: state.roads.map((road) => (upgradable.includes(road) ? { ...road, tier: (road.tier ?? 1) + 1 } : road)) },
    events: [],
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
  const onBridge = bridgeKeys(state);
  const targeted = state.roads.filter(isTarget);
  const roads = targeted.filter((road) => !onBridge.has(tileKey(road)));
  if (roads.length === 0 && roundabouts.length === 0) return fail(targeted.length > 0 ? 'error.bridgeTile' : 'error.noRoadHere');
  const next: GameState = {
    ...state,
    roads: state.roads.filter((candidate) => !roads.includes(candidate)),
    roundabouts: state.roundabouts.filter((center) => !roundabouts.includes(center)),
  };
  if (strandsBuilding(state, next)) return fail('error.lastAccessOfBuilding');
  return { state: next, events: [] };
}

function removeBridge(state: GameState, tile: Coord): CommandOutcome {
  const bridge = bridgeAt(state, tile);
  if (!bridge) return fail('error.noBridgeHere');
  const next = withoutBridge(state, bridge);
  if (strandsBuilding(state, next)) return fail('error.lastAccessOfBuilding');
  return { state: { ...next, urbs: next.urbs + refundOf(bridge) }, events: [] };
}

function strandsBuilding(before: GameState, after: GameState): boolean {
  const hasAccess = (state: GameState, building: Building) => frontHasAccess(state, building.type, building.x, building.y, building.rotation, building.tier);
  return before.buildings.some(
    (building) => !['busStop', 'brtStation', 'railStation'].includes(building.type) && BUILDING_SPECS[building.type].requiresRoad && hasAccess(before, building) && !hasAccess(after, building),
  );
}

function placeBuilding(state: GameState, type: BuildingType, x: number, y: number, requestedRotation?: Rotation, solar = false, colorVariant?: HomeColorVariant): CommandOutcome {
  if (isRetired(type) || citizenCount(state) < (ECOLOGY_UNLOCKS[type] ?? 0) || (solar && citizenCount(state) < ECOLOGY.solarUnlockCitizens)) return fail('error.itemLocked');
  if (solar && type !== 'home') return fail('error.cannotProduce');
  const extraCost = solar ? ECOLOGY.solarCost : 0;
  const rotation = requestedRotation ?? autoRotation(state, type, x, y);
  const issue = placementIssue(state, type, x, y, rotation);
  if (issue) return fail(issue);
  if (state.urbs < placementCost(type) + extraCost) return fail('error.notEnoughUrbs');
  const building = { ...createBuilding(state.nextId, type, x, y, rotation), ...(solar ? { solar: true } : {}), ...(type === 'home' && colorVariant ? { colorVariant } : {}), ...(type === 'battery' ? { storedEnergy: 0 } : {}) };
  const utilityIssue = type === 'home' ? utilityIssueFor(state, tierDemand(1)) : isFacilityType(type) ? utilityIssueFor(state, { power: 0, water: FACILITIES[type].water }) : null;
  if (utilityIssue) return fail(utilityIssue);
  return {
    state: { ...state, urbs: state.urbs - placementCost(type) - extraCost, nextId: state.nextId + 1, buildings: [...state.buildings, building] },
    events: [{ type: 'BuildingPlaced', id: building.id }],
  };
}

function setCoalEnabled(state: GameState, id: number, enabled: boolean): CommandOutcome {
  const building = state.buildings.find(b => b.id === id);
  if (!building) return fail('error.unknownBuilding');
  if (building.type !== 'coalPlant') return fail('error.cannotProduce');
  return { state: { ...state, buildings: state.buildings.map(b => b === building ? { ...b, coalEnabled: enabled } : b) }, events: [] };
}

function sellBuilding(state: GameState, id: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === id);
  if (!building) return fail('error.unknownBuilding');
  if ((isStorageType(building.type) || building.type === 'workshop' || building.type === 'factory' || building.type === 'packhouse') && !canRemoveStorage(state, building.id)) return fail('error.storageInUse');
  if ((building.type === 'powerPlant' || building.type === 'waterTower') && !canLoseUtility(state, building)) return fail('error.utilityInUse');
  if (building.type === 'marina' && boatsOfMarina(state, building.id).length > 0) return fail('error.marinaInUse');
  const refund = Math.floor(placementCost(building.type) * GAME_CONFIG.sellRefundRatio);
  return {
    state: withoutBrokenLines({ ...state, urbs: state.urbs + refund, buildings: state.buildings.filter((candidate) => candidate !== building) }, id, true),
    events: [{ type: 'BuildingSold', id }],
  };
}

function withoutDanglingExits(tiles: TransitTile[]): TransitTile[] {
  const keys = new Set(tiles.map(tileKey));
  return tiles.map(tile => {
    const exits = tile.exits.filter(d => keys.has(tileKey(neighbour(tile, d))));
    return exits.length === tile.exits.length ? tile : { ...tile, exits };
  });
}

function withoutBrokenLines(state: GameState, stopId: number, removed: boolean): GameState {
  const broken = (line: BusLine) => line.stops.includes(stopId) && (removed || !routeForLine(state, line));
  const dropped = new Set([...(state.busLines ?? []), ...(state.transitLines ?? [])].filter(broken).map(line => line.id));
  if (dropped.size === 0) return state;
  return {
    ...state,
    busLines: (state.busLines ?? []).filter(line => !dropped.has(line.id)),
    transitLines: (state.transitLines ?? []).filter(line => !dropped.has(line.id)),
    transitFleet: (state.transitFleet ?? []).map(vehicle => vehicle.lineId !== undefined && dropped.has(vehicle.lineId) ? { ...vehicle, lineId: undefined } : vehicle),
  };
}

function moveBuilding(state: GameState, id: number, x: number, y: number, requestedRotation: Rotation | undefined, now: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === id);
  if (!building) return fail('error.unknownBuilding');
  if (building.type === 'marina' && boatsOfMarina(state, building.id).length > 0) return fail('error.marinaInUse');
  const without: GameState = { ...state, buildings: state.buildings.filter((candidate) => candidate !== building) };
  const rotation = requestedRotation ?? autoRotation(without, building.type, x, y, building.tier);
  const issue = placementIssue(without, building.type, x, y, rotation, { isMove: true, tier: building.tier });
  if (issue) return fail(issue);
  return {
    state: withoutBrokenLines({ ...state, buildings: state.buildings.map((candidate) => (candidate === building ? restartRunningProduction({ ...building, x, y, rotation }, now) : candidate)) }, id, false),
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

function rushProduction(state: GameState, buildingId: number, now: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return fail('error.unknownBuilding');
  const running = runningEntry(building);
  if (!running) return fail('error.nothingToRush');
  const price = rushPrice(running, now);
  if (state.urbs < price) return fail('error.notEnoughUrbs');
  return {
    state: {
      ...state,
      urbs: state.urbs - price,
      buildings: state.buildings.map((candidate) => (candidate === building ? rushRunningProduction(building, now) : candidate)),
    },
    events: [{ type: 'ProductionCompleted', buildingId, item: running.item, at: now }],
  };
}

function collect(state: GameState, buildingId: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return fail('error.unknownBuilding');
  if (isShopType(building.type)) return collectShopEarnings(state, building);
  if (building.type === 'home') return collectTax(state, building);
  if (isVenue(building)) return collectTakings(state, building);
  if (!building.queue.some((entry) => entry.done)) return fail('error.nothingToCollect');
  if (!hasStorage(state)) return fail('error.noStorehouse');

  const capacity = storageCapacity(state);
  const used = storageUsed(state.storage);
  const materials = { ...state.storage.materials };
  const goods = { ...state.storage.goods };
  const remaining: QueueEntry[] = [];
  let collected = 0;
  for (const entry of building.queue) {
    const compartment = compartmentOf(entry.item);
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
  return isShopType(building.type) ? shopTierOf(building).maxSlots : productionTierOf(building).maxSlots;
}

function buySlot(state: GameState, buildingId: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return fail('error.unknownBuilding');
  if (BUILDING_SPECS[building.type].initialSlots === 0) return fail('error.cannotProduce');
  if (building.slotCount >= maxSlotsOf(building)) return fail('error.maxSlots');
  const price = isShopType(building.type) ? slotPriceOf(building, building.slotCount + 1) : (SLOT_PRICES[building.slotCount + 1] ?? 0);
  if (state.urbs < price) return fail('error.notEnoughUrbs');
  return {
    state: {
      ...state,
      urbs: state.urbs - price,
      buildings: state.buildings.map((candidate) => (candidate === building ? { ...building, slotCount: building.slotCount + 1, stacks: isShopType(building.type) ? [...building.stacks, emptyStack()] : building.stacks } : candidate)),
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
  if (!isShopType(building.type) || !(good in GOODS)) return fail('error.notAShop');
  if (!canSell(building, good)) return fail('error.notSoldHere');
  const slotIndex = building.stacks.findIndex((stack) => stack.stock === 0);
  if (slotIndex === -1) return fail('error.queueFull');
  const available = state.storage.goods[good] ?? 0;
  if (available < SHOP.stackSize) return fail('error.missingGoods');
  const stacks = building.stacks.map((stack, index) =>
    index === slotIndex ? { ...stack, good, stock: SHOP.stackSize, nextSaleAt: now + saleIntervalOf(building) } : stack,
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
  if (isHome && missingServices(serviceCoverage(state), building, nextTier).length > 0) return fail('error.serviceRequired');
  if (isHome || building.type === 'casino') {
    const footprintIssue = placementIssue(state, building.type, building.x, building.y, building.rotation, {
      ignoreBuildingId: building.id,
      isMove: true,
      tier: nextTier,
    });
    if (footprintIssue === 'error.tilesOccupied') return fail(isHome ? 'error.homeExpansionBlocked' : 'error.casinoExpansionBlocked');
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
  if (citizenCount(state) < (equipment === 'solar' ? ECOLOGY.solarUnlockCitizens : 6)) return fail('error.itemLocked');
  const cost = (equipment === 'solar' ? ECOLOGY.solarCost : ECOLOGY.insulationCost) * home.tier;
  if (state.urbs < cost) return fail('error.notEnoughUrbs');
  return { state: { ...state, urbs: state.urbs - cost, buildings: state.buildings.map(b => b.id === id ? { ...b, [field]: true } : b) }, events: [] };
}

const ROUTE_ERRORS = { invalid: 'error.invalidBusLine', stopNotOnNetwork: 'error.stopNotOnNetwork', notConnected: 'error.networkNotConnected' } as const;

function setBusLine(state: GameState, id: number | undefined, stops: number[]): CommandOutcome {
  if (citizenCount(state) < 32) return fail('error.itemLocked');
  if (id !== undefined && !(state.busLines ?? []).some(line => line.id === id)) return fail('error.invalidBusLine');
  const line = { id: id ?? state.nextId, stops };
  const failure = routeFailure(state, line);
  if (failure) return fail(ROUTE_ERRORS[failure]);
  return { state: { ...state, nextId: id === undefined ? state.nextId + 1 : state.nextId, busLines: [...(state.busLines ?? []).filter(l => l.id !== line.id), line] }, events: [] };
}

function transitCommand(state: GameState, command: Extract<Command, { type: 'BuildTransit' | 'DemolishTransit' | 'RepairTransitNetwork' | 'SetTransitLine' | 'DeleteTransitLine' | 'BuyTransitVehicle' | 'SellTransitVehicle' | 'AssignTransitVehicle' }>): CommandOutcome {
  const lines = state.transitLines ?? [], fleet = state.transitFleet ?? [];
  if (command.type === 'BuildTransit') {
    if (citizenCount(state) < TRANSIT[command.mode].unlock) return fail('error.itemLocked');
    const result = extendNetwork(state, command.mode, command.from, command.to, command.horizontalFirst ?? true);
    if ('key' in result) return result;
    if (state.urbs < result.cost) return fail('error.notEnoughUrbs');
    return { state: { ...state, urbs: state.urbs - result.cost, [command.mode === 'brt' ? 'brtRoads' : 'rails']: result.tiles }, events: [] };
  }
  if (command.type === 'DemolishTransit') {
    if (![command.from.x, command.from.y, command.to.x, command.to.y].every(n => Number.isSafeInteger(n) && n >= 0) || !isInsideOwnedParcels(state, command.from) || !isInsideOwnedParcels(state, command.to)) return fail('error.outsideOwnedParcels');
    const targets = new Set(roadPath(command.from, command.to, command.horizontalFirst ?? true).map(tileKey));
    const kept = networkTiles(state, command.mode).filter(p => !targets.has(tileKey(p)));
    if (kept.length === networkTiles(state, command.mode).length) return fail('error.noRoadHere');
    const tiles = withoutDanglingExits(kept);
    const next = { ...state, [command.mode === 'brt' ? 'brtRoads' : 'rails']: tiles };
    if (strandsBuilding(state, next)) return fail('error.lastAccessOfBuilding');
    return { state: next, events: [] };
  }
  if (command.type === 'RepairTransitNetwork') {
    const tiles = repairNetwork(state, command.mode);
    if (!tiles) return fail('error.networkIntact');
    return { state: { ...state, [command.mode === 'brt' ? 'brtRoads' : 'rails']: tiles }, events: [] };
  }
  if (command.type === 'DeleteTransitLine') return { state: { ...state, transitLines: lines.filter(l => l.id !== command.id), transitFleet: fleet.map(v => v.lineId === command.id ? { ...v, lineId: undefined } : v) }, events: [] };
  if (command.type === 'SetTransitLine') {
    if (citizenCount(state) < TRANSIT[command.mode].unlock) return fail('error.itemLocked');
    if (![command.peakHeadway, command.offPeakHeadway].every(n => Number.isFinite(n) && n > 0 && n <= 60)) return fail('error.invalidQuantity');
    if (command.mode === 'brt' && (command.peakHeadway < 5 || command.peakHeadway > 10 || command.offPeakHeadway < 10 || command.offPeakHeadway > 15)) return fail('error.invalidQuantity');
    if (command.id !== undefined && !lines.some(l => l.id === command.id && l.mode === command.mode)) return fail('error.invalidBusLine');
    const line: TransitLine = { id: command.id ?? state.nextId, mode: command.mode, stops: command.stops, peakHeadway: command.peakHeadway, offPeakHeadway: command.offPeakHeadway };
    const failure = routeFailure(state, line);
  if (failure) return fail(ROUTE_ERRORS[failure]);
    return { state: { ...state, nextId: command.id === undefined ? state.nextId + 1 : state.nextId, transitLines: [...lines.filter(l => l.id !== line.id), line] }, events: [] };
  }
  if (command.type === 'BuyTransitVehicle') {
    if (!Object.hasOwn(TRANSIT, command.kind) || !('price' in TRANSIT[command.kind])) return fail('error.invalidQuantity');
    const spec = TRANSIT[command.kind];
    if (citizenCount(state) < TRANSIT[spec.mode].unlock) return fail('error.itemLocked');
    if (state.urbs < spec.price) return fail('error.notEnoughUrbs');
    return { state: { ...state, urbs: state.urbs - spec.price, nextId: state.nextId + 1, transitFleet: [...fleet, { id: state.nextId, kind: command.kind, purchasePrice: spec.price }] }, events: [] };
  }
  const vehicle = fleet.find(v => v.id === command.id);
  if (!vehicle) return fail('error.invalidQuantity');
  if (command.type === 'SellTransitVehicle') return { state: { ...state, urbs: state.urbs + vehicle.purchasePrice / 2, transitFleet: fleet.filter(v => v.id !== vehicle.id) }, events: [] };
  const line = lines.find(l => l.id === command.lineId);
  if (command.lineId !== undefined && (!line || line.mode !== TRANSIT[vehicle.kind].mode)) return fail('error.invalidBusLine');
  return { state: { ...state, transitFleet: fleet.map(v => v.id === vehicle.id ? { ...v, lineId: command.lineId } : v) }, events: [] };
}
