import { FIXTURE_IDS, FLEET_VEHICLES, TRANSIT, STAFF_ROLES, isVenueType, MAX_CASINO_TIER, BOAT_FAMILIES, BUILDING_SPECS, CROP_IDS, GAME_CONFIG, GOODS, MATERIALS, MAX_ROAD_TIER, TRADE_EFFECTS, TRADE_LIMITS, TUTORIAL_STEPS, STOP_NAME_MAX_LENGTH, isTransitStopType, type GameState, type TradeEffect, type TutorialStep, isHomeType, canHaveSolarPanels, isDifficulty, isRepaintableType, mayCarryLegacyColor, colorVariantsOfType, type BuildingType } from '../core';

type Json = Record<string, unknown>;

const ROAD_KINDS = ['road', 'crossing'];
const LEGACY_COLORS: readonly string[] = ['default', 'a', 'b', 'c'];

const isRecord = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isInt = (value: unknown, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
const isNonNegative = (value: unknown): value is number => isNumber(value) && value >= 0;
const isArrayOf = (value: unknown, check: (item: unknown) => boolean): boolean => Array.isArray(value) && value.every(check);

const isCoord = (value: unknown, max = Number.MAX_SAFE_INTEGER): boolean => isRecord(value) && isInt(value.x, 0, max) && isInt(value.y, 0, max);

function isAmountRecord(value: unknown, validKeys: string[]): boolean {
  return isRecord(value) && Object.entries(value).every(([key, amount]) => validKeys.includes(key) && (key === 'coal' ? isNonNegative(amount) : isInt(amount, 0)));
}

const cropIds: string[] = [...CROP_IDS];
const itemIds = [...Object.keys(MATERIALS), ...Object.keys(GOODS)];

function isQueueEntry(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.item === 'string' &&
    itemIds.includes(value.item) &&
    isNonNegative(value.duration) &&
    (value.startedAt === null || isNumber(value.startedAt)) &&
    typeof value.done === 'boolean' &&
    isInt(value.quantity, 1)
  );
}

function isStack(value: unknown): boolean {
  return (
    isRecord(value) &&
    (value.good === null || (typeof value.good === 'string' && Object.hasOwn(GOODS, value.good))) &&
    isInt(value.stock, 0) &&
    (value.nextSaleAt === null || isNumber(value.nextSaleAt)) &&
    isNonNegative(value.earned)
  );
}

function isVenueData(value: unknown): boolean {
  return (
    isRecord(value) &&
    isInt(value.nextFixtureId, 1) &&
    isNonNegative(value.takings) &&
    (value.earned === undefined || isNonNegative(value.earned)) &&
    (value.price === undefined || isInt(value.price, 1, 20)) &&
    (value.rng === undefined || isNumber(value.rng)) &&
    (value.reputation === undefined || (isNumber(value.reputation) && value.reputation >= 0 && value.reputation <= 100)) &&
    (value.cooldownUntil === undefined || isNumber(value.cooldownUntil)) &&
    (value.event === undefined || (isRecord(value.event) && isNumber(value.event.startsAt) && isNumber(value.event.endsAt) && value.event.endsAt > value.event.startsAt && isNonNegative(value.event.budget))) &&
    (value.staff === undefined || (isRecord(value.staff) && Object.entries(value.staff).every(([role, count]) => STAFF_ROLES.includes(role as never) && isInt(count, 0, 20)))) &&
    isArrayOf(value.fixtures, fixture => isRecord(fixture) && isInt(fixture.id, 1) && isInt(fixture.id, 1, (value.nextFixtureId as number) - 1) && FIXTURE_IDS.includes(fixture.type as never) && isCoord(fixture) && isInt(fixture.rotation, 0, 3) && (fixture.condition === undefined || (isNumber(fixture.condition) && fixture.condition >= 0 && fixture.condition <= 100)) && (fixture.broken === undefined || typeof fixture.broken === 'boolean') && (fixture.good === undefined || (typeof fixture.good === 'string' && Object.hasOwn(GOODS, fixture.good))) && (fixture.stock === undefined || isNonNegative(fixture.stock)))
  );
}

// A Home keeps whatever color it was saved with, before the kit palettes were enforced: its Tiers can come from a kit with fewer colors.
function isColorAllowed(type: BuildingType, color: unknown): boolean {
  const allowed: readonly string[] = isHomeType(type) ? ['default', 'a', 'b', 'c'] : colorVariantsOfType(type);
  return allowed.includes(color as string);
}

// A building whose model has since been drawn with its own colors is no longer repaintable, but a save made before keeps the color it was given: the game ignores it.
function isColorAccepted(type: unknown, color: unknown): boolean {
  if (typeof type !== 'string' || !Object.hasOwn(BUILDING_SPECS, type)) return false;
  if (isRepaintableType(type)) return isColorAllowed(type as BuildingType, color);
  return mayCarryLegacyColor(type) && LEGACY_COLORS.includes(color as string);
}

function isBuilding(value: unknown): boolean {
  return (
    isRecord(value) &&
    isInt(value.id, 0) &&
    typeof value.type === 'string' &&
    Object.hasOwn(BUILDING_SPECS, value.type) &&
    isInt(value.x, 0) &&
    isInt(value.y, 0) &&
    isInt(value.rotation, 0, 3) &&
    isInt(value.slotCount, 0, 8) &&
    isArrayOf(value.queue, isQueueEntry) &&
    isArrayOf(value.stacks, isStack) &&
    isInt(value.tier, 1, value.type === 'coalPlant' ? 4 : 8) &&
    isNonNegative(value.taxCitizenMs) &&
    (value.insulated === undefined || (isHomeType(value.type) && typeof value.insulated === 'boolean')) &&
    (value.solar === undefined || (typeof value.type === 'string' && canHaveSolarPanels(value.type as BuildingType) && typeof value.solar === 'boolean')) &&
    (value.colorVariant === undefined || isColorAccepted(value.type, value.colorVariant)) &&
    (value.venue === undefined || (typeof value.type === 'string' && isVenueType(value.type) && isVenueData(value.venue))) &&
    (value.name === undefined || (typeof value.type === 'string' && isTransitStopType(value.type) && typeof value.name === 'string' && value.name.length > 0 && value.name.length <= STOP_NAME_MAX_LENGTH)) &&
    (value.coalEnabled === undefined || (value.type === 'coalPlant' && typeof value.coalEnabled === 'boolean')) &&
    (value.storedEnergy === undefined || (value.type === 'battery' && isNonNegative(value.storedEnergy) && value.storedEnergy <= 24))
  );
}

function isFieldTile(value: unknown): boolean {
  if (!isRecord(value) || !isCoord(value)) return false;
  if (value.crop === undefined) return true;
  return isRecord(value.crop) && cropIds.includes(value.crop.species as string) && isNumber(value.crop.plantedAt);
}

function isTradeLine(value: unknown): boolean {
  return isRecord(value) && typeof value.item === 'string' && (Object.hasOwn(MATERIALS, value.item) || Object.hasOwn(GOODS, value.item)) && isInt(value.quantity, 1, TRADE_LIMITS.maxQuantity);
}

function isTradeLedgerEntry(value: unknown): boolean {
  if (!isRecord(value) || typeof value.offerId !== 'string' || value.offerId === '') return false;
  if (!TRADE_EFFECTS.includes(value.effect as TradeEffect) || !isNumber(value.at) || typeof value.confirmed !== 'boolean') return false;
  if (value.lot !== undefined && !(isArrayOf(value.lot, isTradeLine) && (value.lot as unknown[]).length <= TRADE_LIMITS.maxLines)) return false;
  if (value.urbs !== undefined && !isInt(value.urbs, 0, TRADE_LIMITS.maxPrice)) return false;
  return value.peer === undefined || typeof value.peer === 'string';
}

function isChallengeProgress(value: unknown): boolean {
  if (!isRecord(value) || typeof value.id !== 'string' || value.id === '' || !isNumber(value.deadline)) return false;
  if (!isArrayOf(value.goal, isTradeLine) || (value.goal as unknown[]).length === 0 || (value.goal as unknown[]).length > TRADE_LIMITS.maxLines) return false;
  if (!isRecord(value.stock)) return false;
  const goal = value.goal as { item: string; quantity: number }[];
  return Object.entries(value.stock).every(([item, amount]) => {
    const line = goal.find((candidate) => candidate.item === item);
    return line !== undefined && isInt(amount, 0, line.quantity);
  });
}

function isChallengeClaim(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && value.id !== '' && isNumber(value.at) && isInt(value.urbs, 0);
}

function isMarket(value: unknown): boolean {
  return isRecord(value) && Object.entries(value).every(([good, price]) => Object.hasOwn(GOODS, good) && isRecord(price) && isNumber(price.points) && isNumber(price.updatedAt));
}

export function validateGameState(value: unknown): GameState | null {
  if (!isRecord(value)) return null;
  const parcelMax = GAME_CONFIG.mapSizeInParcels - 1;
  const valid =
    typeof value.seed === 'string' &&
    isNumber(value.rngState) &&
    isNonNegative(value.urbs) &&
    isNumber(value.lastSeen) &&
    isInt(value.nextId, 1) &&
    isArrayOf(value.ownedParcels, (parcel) => isCoord(parcel, parcelMax)) &&
    isArrayOf(value.buildings, isBuilding) &&
    isRecord(value.storage) &&
    isAmountRecord(value.storage.materials, Object.keys(MATERIALS)) &&
    isAmountRecord(value.storage.goods, Object.keys(GOODS)) &&
    isRecord(value.seedStock) &&
    Object.values(value.seedStock).every(amount => isInt(amount, 0)) &&
    isArrayOf(value.fields, isFieldTile) &&
    typeof value.marketUnlocked === 'boolean' &&
    isMarket(value.market) &&
    isArrayOf(value.roads, (road) => isCoord(road) && ROAD_KINDS.includes((road as Json).kind as string) && ((road as Json).tier === undefined || isInt((road as Json).tier, 1, MAX_ROAD_TIER))) &&
    isArrayOf(value.roundabouts, (center) => isCoord(center)) &&
    (value.tutorial === null || TUTORIAL_STEPS.includes(value.tutorial as TutorialStep)) &&
    isArrayOf(value.tradeLedger, isTradeLedgerEntry);
  if (!valid) return null;
  if (value.solidarityMs !== undefined && (!isNonNegative(value.solidarityMs) || value.solidarityMs > 24 * 3_600_000)) return null;
  if (value.donations !== undefined && !isArrayOf(value.donations, donation => isRecord(donation) && typeof donation.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(donation.id) && isInt(donation.value, 1) && (donation.accountId === undefined || typeof donation.accountId === 'string'))) return null;
  if (Array.isArray(value.donations) && new Set((value.donations as { id: string }[]).map(donation => donation.id)).size !== value.donations.length) return null;
  if (value.timeOffset !== undefined && (!isNonNegative(value.timeOffset) || value.timeOffset > Number.MAX_SAFE_INTEGER)) return null;
  if (value.adaptationUntil !== undefined && !isNumber(value.adaptationUntil)) return null;
  if (value.waterTiles !== undefined && !isArrayOf(value.waterTiles, tile => isRecord(tile) && isCoord(tile))) return null;
  if (value.waterTiles !== undefined && new Set((value.waterTiles as { x: number; y: number }[]).map(tile => `${tile.x}:${tile.y}`)).size !== (value.waterTiles as unknown[]).length) return null;
  if (value.boats !== undefined && !isArrayOf(value.boats, boat => isRecord(boat) && isCoord(boat) && isInt(boat.id, 1) && BOAT_FAMILIES.includes(boat.family as never) && isInt(boat.marinaId, 1) && (boat.catchSince === undefined || (boat.family === 'fishing' && isNumber(boat.catchSince))) && (boat.tier === undefined || (boat.family === 'casino' && isInt(boat.tier, 1, MAX_CASINO_TIER))))) return null;
  if (value.bridges !== undefined && !isArrayOf(value.bridges, bridge => isRecord(bridge) && isCoord(bridge) && [1, 2, 3, 5].includes(bridge.length as number) && ['x', 'y'].includes(bridge.axis as string))) return null;
  if (value.casinoRng !== undefined && !isNumber(value.casinoRng)) return null;
  if (value.difficulty !== undefined && !isDifficulty(value.difficulty)) return null;
  if (value.challenge !== undefined && !isChallengeProgress(value.challenge)) return null;
  if (value.challengeClaims !== undefined && !isArrayOf(value.challengeClaims, isChallengeClaim)) return null;
  if (value.ecologyDismissed !== undefined && typeof value.ecologyDismissed !== 'boolean') return null;
  if (value.busLines !== undefined && !isArrayOf(value.busLines, line => isRecord(line) && isInt(line.id, 1) &&
    isArrayOf(line.stops, id => isInt(id, 0)) && (line.stops as number[]).length >= 2 &&
    new Set(line.stops as number[]).size === (line.stops as number[]).length)) return null;
  for (const key of ['brtRoads', 'rails']) {
    if (value[key] === undefined) continue;
    if (!isArrayOf(value[key], p => isRecord(p) && isCoord(p) && isArrayOf(p.exits, d => ['N', 'E', 'S', 'W'].includes(d as string)) && new Set(p.exits as string[]).size === (p.exits as string[]).length)) return null;
    const tiles = value[key] as { x: number; y: number }[];
    if (new Set(tiles.map(p => `${p.x}:${p.y}`)).size !== tiles.length) return null;
  }
  if (value.transitLines !== undefined && !isArrayOf(value.transitLines, l => isRecord(l) && isInt(l.id, 1) && ['brt', 'rail'].includes(l.mode as string) &&
    isArrayOf(l.stops, id => isInt(id, 0)) && (l.stops as number[]).length >= 2 && new Set(l.stops as number[]).size === (l.stops as number[]).length &&
    isNumber(l.peakHeadway) && isNumber(l.offPeakHeadway) && l.peakHeadway > 0 && l.offPeakHeadway > 0 && l.peakHeadway <= 60 && l.offPeakHeadway <= 60 &&
    (l.mode !== 'brt' || (l.peakHeadway >= 5 && l.peakHeadway <= 10 && l.offPeakHeadway >= 10 && l.offPeakHeadway <= 15)))) return null;
  if (value.transitFleet !== undefined && !isArrayOf(value.transitFleet, v => isRecord(v) && isInt(v.id, 1) && FLEET_VEHICLES.some(({ id }) => id === v.kind) && isNonNegative(v.purchasePrice) && (v.lineId === undefined || isInt(v.lineId, 1)))) return null;
  const state = value as unknown as GameState;
  const ids = [...state.buildings.map(b => b.id), ...(state.boats ?? []).map(b => b.id), ...(state.busLines ?? []).map(l => l.id), ...(state.transitLines ?? []).map(l => l.id), ...(state.transitFleet ?? []).map(v => v.id)];
  if (new Set(ids).size !== ids.length || ids.some(id => id >= state.nextId)) return null;
  const roadKeys = new Set(state.roads.map(road => `${road.x}:${road.y}`));
  const bridged = new Set<string>();
  for (const bridge of state.bridges ?? []) {
    for (let step = 0; step < bridge.length; step++) {
      const key = bridge.axis === 'x' ? `${bridge.x + step}:${bridge.y}` : `${bridge.x}:${bridge.y + step}`;
      if (bridged.has(key) || !roadKeys.has(key) || !(state.waterTiles ?? []).some(tile => `${tile.x}:${tile.y}` === key)) return null;
      bridged.add(key);
    }
  }
  const waterKeys = new Set((state.waterTiles ?? []).map(tile => `${tile.x}:${tile.y}`));
  for (const boat of state.boats ?? []) {
    if (!waterKeys.has(`${boat.x}:${boat.y}`) || !state.buildings.some(b => b.id === boat.marinaId && b.type === 'marina')) return null;
  }
  if (new Set((state.boats ?? []).map(boat => `${boat.x}:${boat.y}`)).size !== (state.boats ?? []).length) return null;
  for (const line of state.busLines ?? []) {
    if (line.stops.some(id => id >= state.nextId || (state.buildings.some(b => b.id === id) && !state.buildings.some(b => b.id === id && b.type === 'busStop')))) return null;
  }
  for (const line of state.transitLines ?? []) {
    const type = line.mode === 'brt' ? 'brtStation' : 'railStation';
    if (line.stops.some(id => id >= state.nextId || (state.buildings.some(b => b.id === id) && !state.buildings.some(b => b.id === id && b.type === type)))) return null;
  }
  for (const vehicle of state.transitFleet ?? []) {
    if (vehicle.lineId === undefined) continue;
    const line = state.transitLines?.find(l => l.id === vehicle.lineId);
    if (!line || line.mode !== TRANSIT[vehicle.kind].mode) return null;
  }
  return state;
}
