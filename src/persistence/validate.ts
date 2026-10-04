import { BUILDING_SPECS, CROP_IDS, GAME_CONFIG, GOODS, MATERIALS, TUTORIAL_STEPS, type GameState, type TutorialStep } from '../core';

type Json = Record<string, unknown>;

const ROAD_KINDS = ['road', 'crossing'];

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
    (value.good === null || (typeof value.good === 'string' && value.good in GOODS)) &&
    isInt(value.stock, 0) &&
    (value.nextSaleAt === null || isNumber(value.nextSaleAt)) &&
    isNonNegative(value.earned)
  );
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
    (value.insulated === undefined || (value.type === 'home' && typeof value.insulated === 'boolean')) &&
    (value.solar === undefined || (value.type === 'home' && typeof value.solar === 'boolean')) &&
    (value.colorVariant === undefined || (value.type === 'home' && ['default', 'a', 'b', 'c'].includes(value.colorVariant as string))) &&
    (value.coalEnabled === undefined || (value.type === 'coalPlant' && typeof value.coalEnabled === 'boolean')) &&
    (value.storedEnergy === undefined || (value.type === 'battery' && isNonNegative(value.storedEnergy) && value.storedEnergy <= 24))
  );
}

function isFieldTile(value: unknown): boolean {
  if (!isRecord(value) || !isCoord(value)) return false;
  if (value.crop === undefined) return true;
  return isRecord(value.crop) && cropIds.includes(value.crop.species as string) && isNumber(value.crop.plantedAt);
}

function isMarket(value: unknown): boolean {
  return isRecord(value) && Object.entries(value).every(([good, price]) => good in GOODS && isRecord(price) && isNumber(price.points) && isNumber(price.updatedAt));
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
    isArrayOf(value.roads, (road) => isCoord(road) && ROAD_KINDS.includes((road as Json).kind as string)) &&
    isArrayOf(value.roundabouts, (center) => isCoord(center)) &&
    (value.tutorial === null || TUTORIAL_STEPS.includes(value.tutorial as TutorialStep));
  if (!valid) return null;
  if (value.timeOffset !== undefined && (!isNonNegative(value.timeOffset) || value.timeOffset > Number.MAX_SAFE_INTEGER)) return null;
  if (value.adaptationUntil !== undefined && !isNumber(value.adaptationUntil)) return null;
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
  if (value.transitFleet !== undefined && !isArrayOf(value.transitFleet, v => isRecord(v) && isInt(v.id, 1) && ['brtElectric', 'trainElectric', 'trainCoal'].includes(v.kind as string) && isNonNegative(v.purchasePrice) && (v.lineId === undefined || isInt(v.lineId, 1)))) return null;
  const state = value as unknown as GameState;
  const ids = [...state.buildings.map(b => b.id), ...(state.busLines ?? []).map(l => l.id), ...(state.transitLines ?? []).map(l => l.id), ...(state.transitFleet ?? []).map(v => v.id)];
  if (new Set(ids).size !== ids.length || ids.some(id => id >= state.nextId)) return null;
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
    if (!line || (line.mode === 'brt') !== (vehicle.kind === 'brtElectric')) return null;
  }
  return state;
}
