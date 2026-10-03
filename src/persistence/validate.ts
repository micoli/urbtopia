import { GAME_CONFIG, GOODS, MATERIALS, TUTORIAL_STEPS, type GameState, type TutorialStep } from '../core';

type Json = Record<string, unknown>;

const BUILDING_TYPES = ['workshop', 'factory', 'shop', 'storehouse', 'home', 'powerPlant', 'waterTower', 'silo', 'vault'];
const ROAD_KINDS = ['road', 'crossing'];

const isRecord = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isInt = (value: unknown, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): value is number =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
const isNonNegative = (value: unknown): value is number => isNumber(value) && value >= 0;
const isArrayOf = (value: unknown, check: (item: unknown) => boolean): boolean => Array.isArray(value) && value.every(check);

const isCoord = (value: unknown, max = Number.MAX_SAFE_INTEGER): boolean => isRecord(value) && isInt(value.x, 0, max) && isInt(value.y, 0, max);

function isAmountRecord(value: unknown, validKeys: string[]): boolean {
  return isRecord(value) && Object.entries(value).every(([key, amount]) => validKeys.includes(key) && isInt(amount, 0));
}

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
    BUILDING_TYPES.includes(value.type) &&
    isInt(value.x, 0) &&
    isInt(value.y, 0) &&
    isInt(value.rotation, 0, 3) &&
    isInt(value.slotCount, 0, 8) &&
    isArrayOf(value.queue, isQueueEntry) &&
    isArrayOf(value.stacks, isStack) &&
    isInt(value.tier, 1, 8) &&
    isNonNegative(value.taxCitizenMs)
  );
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
    typeof value.marketUnlocked === 'boolean' &&
    isMarket(value.market) &&
    isArrayOf(value.roads, (road) => isCoord(road) && ROAD_KINDS.includes((road as Json).kind as string)) &&
    isArrayOf(value.roundabouts, (center) => isCoord(center)) &&
    (value.tutorial === null || TUTORIAL_STEPS.includes(value.tutorial as TutorialStep));
  return valid ? (value as unknown as GameState) : null;
}
