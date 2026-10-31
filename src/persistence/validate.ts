import { FIXTURE_IDS, hasClub, isClubSport, FLEET_VEHICLES, TRANSIT, STAFF_ROLES, isVenueType, TICKETS, sellsTicketsType, MAX_CASINO_TIER, BOAT_FAMILIES, BUILDING_SPECS, CROP_IDS, GAME_CONFIG, GOODS, MATERIALS, MAX_ROAD_TIER, TRADE_EFFECTS, TRADE_LIMITS, TUTORIAL_STEPS, VENUE_TUTORIAL_TYPES, isVenueTutorialStep, STOP_NAME_MAX_LENGTH, bridgeFootprint, bridgeRamps, isInfrastructureBridge, isTransitStopType, isTradeLine, type GameState, type TradeEffect, type TutorialStep, isHomeType, canHaveSolarPanels, isDifficulty, FACTION_IDS, JOURNAL_TYPES, PETITION_CAUSES, SUPPORT_CAUSES, OBJECTIVE_ENTRIES, ORDINANCE_ENTRIES, POLITICS, isRepaintableType, mayCarryLegacyColor, colorVariantsOfType, maxTierOf, type BuildingType } from '../core';

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

function isValidLoop(line: Record<string, unknown>): boolean {
  if (line.loop === undefined) return true;
  return line.loop === true && (line.stops as number[]).length >= 3;
}

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

function isGatheringData(value: unknown): boolean {
  return (
    isRecord(value) &&
    (value.kind === 'show' || value.kind === 'match' || value.kind === 'meeting') &&
    isNumber(value.startsAt) &&
    isNumber(value.endsAt) &&
    value.endsAt > (value.startsAt as number) &&
    isNonNegative(value.cost) &&
    isNonNegative(value.crowd) &&
    isNonNegative(value.tourists) &&
    isNonNegative(value.citizens) &&
    isNonNegative(value.revenue) &&
    isNumber(value.quality) &&
    value.quality >= 0 &&
    value.quality <= 1
  );
}

function isPlayer(value: unknown): boolean {
  return (
    isRecord(value) &&
    isInt(value.id, 1) &&
    typeof value.name === 'string' &&
    typeof value.position === 'string' &&
    isInt(value.rating, 1, 100) &&
    isNumber(value.form) &&
    value.form >= 0 &&
    value.form <= 100 &&
    isNumber(value.morale) &&
    value.morale >= 0 &&
    value.morale <= 100 &&
    isInt(value.age, 14, 60) &&
    isRecord(value.contract) &&
    isInt(value.contract.untilYear, 0) &&
    isNonNegative(value.contract.wage) &&
    isArrayOf(value.history, season => isRecord(season) && isInt(season.year, 0) && isInt(season.played, 0)) &&
    (value.injuredUntil === undefined || isNumber(value.injuredUntil))
  );
}

function isChampionshipData(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonNegative(value.points) &&
    isArrayOf(value.opponents, opponent => isRecord(opponent) && typeof opponent.name === 'string' && isInt(opponent.strength, 1, 100) && isNonNegative(opponent.points)) &&
    isArrayOf(value.fixtures, fixture => isRecord(fixture) && isNumber(fixture.at) && isInt(fixture.opponent, 0) && (fixture.result === undefined || fixture.result === 'win' || fixture.result === 'draw' || fixture.result === 'loss'))
  );
}

function isClubData(value: unknown): boolean {
  return (
    isRecord(value) &&
    isClubSport(value.sport) &&
    typeof value.name === 'string' &&
    isNumber(value.budget) &&
    isInt(value.year, 1) &&
    isInt(value.fame, 1, 5) &&
    isInt(value.nextPlayerId, 1) &&
    isNumber(value.rng) &&
    isArrayOf(value.squad, isPlayer) &&
    isArrayOf(value.market, isPlayer) &&
    (value.championship === undefined || isChampionshipData(value.championship))
  );
}

function isAttractionData(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonNegative(value.takings) &&
    (value.ticket === undefined || isInt(value.ticket, 0, TICKETS.length - 1)) &&
    (value.cooldownUntil === undefined || isNumber(value.cooldownUntil)) &&
    (value.nextMatchBoost === undefined || typeof value.nextMatchBoost === 'boolean') &&
    (value.meetingAt === undefined || isNumber(value.meetingAt)) &&
    (value.shows === undefined || isInt(value.shows, 0)) &&
    (value.gathering === undefined || isGatheringData(value.gathering)) &&
    (value.lastGathering === undefined || isGatheringResult(value.lastGathering))
  );
}

function isGatheringResult(value: unknown): boolean {
  return (
    isRecord(value) &&
    (value.kind === 'show' || value.kind === 'match' || value.kind === 'meeting') &&
    isNumber(value.at) &&
    isNonNegative(value.crowd) &&
    isNonNegative(value.revenue) &&
    isNonNegative(value.cost) &&
    (value.artist === undefined || typeof value.artist === 'string')
  );
}

function isVenueData(value: unknown): boolean {
  return (
    isRecord(value) &&
    isInt(value.nextFixtureId, 1) &&
    isNonNegative(value.takings) &&
    (value.earned === undefined || isNonNegative(value.earned)) &&
    (value.collected === undefined || isNonNegative(value.collected)) &&
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
    isInt(value.tier, 1, value.type === 'coalPlant' ? 4 : Math.max(8, maxTierOf(value.type as BuildingType))) &&
    isNonNegative(value.taxCitizenMs) &&
    (value.insulated === undefined || (isHomeType(value.type) && typeof value.insulated === 'boolean')) &&
    (value.solar === undefined || (typeof value.type === 'string' && canHaveSolarPanels(value.type as BuildingType) && typeof value.solar === 'boolean')) &&
    (value.colorVariant === undefined || isColorAccepted(value.type, value.colorVariant)) &&
    (value.venue === undefined || (typeof value.type === 'string' && isVenueType(value.type) && isVenueData(value.venue))) &&
    (value.club === undefined || (typeof value.type === 'string' && hasClub(value.type) && isClubData(value.club))) &&
    (value.attraction === undefined || (typeof value.type === 'string' && sellsTicketsType(value.type) && isAttractionData(value.attraction))) &&
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

export type StateCheck = { ok: true; state: GameState } | { ok: false; reason: string };

type Rule = () => string | null;

const field = (label: string, holds: () => boolean): Rule => () => (holds() ? null : label);

const entries = (label: string, items: () => unknown, check: (item: unknown) => boolean, optional = false): Rule => () => {
  const list = items();
  if (list === undefined && optional) return null;
  if (!Array.isArray(list)) return `${label}: expected a list`;
  const index = list.findIndex((item) => !check(item));
  return index === -1 ? null : `${label}[${index}]`;
};

const firstFailure = (rules: Rule[]): string | null => {
  for (const rule of rules) {
    const reason = rule();
    if (reason) return reason;
  }
  return null;
};

const tileKey = (tile: { x: number; y: number }): string => `${tile.x}:${tile.y}`;
const hasDuplicates = (keys: string[]): boolean => new Set(keys).size !== keys.length;
const SOLIDARITY_MAX_MS = 24 * 3_600_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUnique = (list: number[]): boolean => new Set(list).size === list.length;

function isBusLine(line: unknown): boolean {
  return isRecord(line) && isInt(line.id, 1) && isArrayOf(line.stops, (id) => isInt(id, 0)) && (line.stops as number[]).length >= 2 && isUnique(line.stops as number[]) && isValidLoop(line);
}

function isTransitLine(line: unknown): boolean {
  return (
    isRecord(line) && isInt(line.id, 1) && ['brt', 'rail'].includes(line.mode as string) &&
    isArrayOf(line.stops, (id) => isInt(id, 0)) && (line.stops as number[]).length >= 2 && isUnique(line.stops as number[]) && isValidLoop(line) &&
    isNumber(line.peakHeadway) && isNumber(line.offPeakHeadway) && line.peakHeadway > 0 && line.offPeakHeadway > 0 && line.peakHeadway <= 60 && line.offPeakHeadway <= 60 &&
    (line.mode !== 'brt' || (line.peakHeadway >= 5 && line.peakHeadway <= 10 && line.offPeakHeadway >= 10 && line.offPeakHeadway <= 15))
  );
}

function isTransitVehicle(vehicle: unknown): boolean {
  return isRecord(vehicle) && isInt(vehicle.id, 1) && FLEET_VEHICLES.some(({ id }) => id === vehicle.kind) && isNonNegative(vehicle.purchasePrice) && (vehicle.lineId === undefined || isInt(vehicle.lineId, 1));
}

function isTransitTile(key: 'brtRoads' | 'rails'): (tile: unknown) => boolean {
  return (tile) =>
    isRecord(tile) && isCoord(tile) && isArrayOf(tile.exits, (direction) => ['N', 'E', 'S', 'W'].includes(direction as string)) && new Set(tile.exits as string[]).size === (tile.exits as string[]).length && (tile.kind === undefined || (key === 'brtRoads' && tile.kind === 'crossing'));
}

function isPoliticsJournal(politics: Json): boolean {
  const isEntry = (item: unknown) => isRecord(item) && isInt(item.day, 0) && JOURNAL_TYPES.includes(item.type as never) && (item.subject === undefined || typeof item.subject === 'string');
  return isArrayOf(politics.journal, isEntry) && (politics.journal as unknown[]).length <= POLITICS.journalSize;
}

function isPoliticsTerm(politics: Json): boolean {
  const { term, mandate, lastElection } = politics;
  if (!isRecord(term) || !isInt(term.startDay, 0) || !isInt(term.number, 1) || !isNumber(mandate) || Math.abs(mandate) > 1) return false;
  if (lastElection === undefined) return true;
  return isRecord(lastElection) && isInt(lastElection.day, 0) && isNumber(lastElection.approval) && lastElection.approval >= 0 && lastElection.approval <= 100 && isNumber(lastElection.mandate) && Math.abs(lastElection.mandate) <= 1 && hasCouncilSeats(lastElection.seats);
}

function hasCouncilSeats(seats: unknown): boolean {
  const total = FACTION_IDS.reduce((sum, faction) => sum + POLITICS.council.seats[faction], 0);
  return isRecord(seats) && Object.keys(seats).length === FACTION_IDS.length && FACTION_IDS.every((faction) => isInt(seats[faction], 1)) && FACTION_IDS.reduce((sum, faction) => sum + (seats[faction] as number), 0) === total;
}

function isPoliticsPetitions(politics: Json): boolean {
  const { petitions, supports, nextPetitionId, adaptationUntilDay } = politics;
  const isParcel = (parcel: unknown) => isRecord(parcel) && isInt(parcel.x, 0) && isInt(parcel.y, 0);
  const isPetition = (petition: unknown) => isRecord(petition) && isInt(petition.id, 1) && PETITION_CAUSES.includes(petition.cause as never) && isParcel(petition.parcel) && isInt(petition.since, 0) && typeof petition.escalated === 'boolean';
  const isSupport = (support: unknown) => isRecord(support) && isInt(support.id, 1) && SUPPORT_CAUSES.includes(support.cause as never) && isParcel(support.parcel) && isInt(support.since, 0);
  if (!isArrayOf(petitions, isPetition) || !isArrayOf(supports, isSupport)) return false;
  const ids = [...(petitions as { id: number }[]), ...(supports as { id: number }[])].map((entry) => String(entry.id));
  if (hasDuplicates(ids) || (petitions as unknown[]).length > POLITICS.petitions.maxOpen || (supports as unknown[]).length > POLITICS.petitions.maxSupport) return false;
  return isInt(nextPetitionId, 1) && ids.every((id) => Number(id) < (nextPetitionId as number)) && isInt(adaptationUntilDay, 0);
}

function isPoliticsObjectives(politics: Json): boolean {
  const objectiveIds = OBJECTIVE_ENTRIES.map((entry) => entry.id as string);
  const { objectives, completed, grantsDue } = politics;
  if (!isArrayOf(objectives, (objective) => isRecord(objective) && objectiveIds.includes(objective.id as string) && isInt(objective.heldDays, 0))) return false;
  if ((objectives as { id: string }[]).length > POLITICS.objectives.activeCount || hasDuplicates((objectives as { id: string }[]).map((objective) => objective.id))) return false;
  if (!isArrayOf(completed, (id) => typeof id === 'string' && objectiveIds.includes(id)) || hasDuplicates(completed as string[])) return false;
  return isNonNegative(grantsDue);
}

function isPoliticsCouncil(politics: Json): boolean {
  const ordinanceIds = ORDINANCE_ENTRIES.map((entry) => entry.id as string);
  const { seats, adopted, retryDay } = politics;
  if (!hasCouncilSeats(seats)) return false;
  if (!isArrayOf(adopted, (id) => typeof id === 'string' && ordinanceIds.includes(id)) || hasDuplicates(adopted as string[])) return false;
  const groups = (adopted as string[]).flatMap((id) => ORDINANCE_ENTRIES.find((entry) => entry.id === id)?.exclusiveGroup ?? []);
  if (hasDuplicates(groups)) return false;
  return isRecord(retryDay) && Object.entries(retryDay).every(([id, day]) => ordinanceIds.includes(id) && isInt(day, 0));
}

function isBoat(boat: unknown): boolean {
  return (
    isRecord(boat) && isCoord(boat) && isInt(boat.id, 1) && BOAT_FAMILIES.includes(boat.family as never) && isInt(boat.marinaId, 1) &&
    (boat.catchSince === undefined || (boat.family === 'fishing' && isNumber(boat.catchSince))) &&
    (boat.tier === undefined || (boat.family === 'casino' && isInt(boat.tier, 1, MAX_CASINO_TIER)))
  );
}

function isBridge(bridge: unknown): boolean {
  return isRecord(bridge) && isCoord(bridge) && [1, 2, 3, 5].includes(bridge.length as number) && ['x', 'y'].includes(bridge.axis as string) && (bridge.carrier === undefined || bridge.carrier === 'road' || bridge.carrier === 'brt' || bridge.carrier === 'pedestrian') && (bridge.carrier === 'pedestrian' ? bridge.side === 1 || bridge.side === -1 : bridge.side === undefined) && (bridge.tier === undefined || (bridge.carrier === 'road' && isInt(bridge.tier, 2, MAX_ROAD_TIER)));
}

function isDonation(donation: unknown): boolean {
  return isRecord(donation) && typeof donation.id === 'string' && UUID.test(donation.id) && isInt(donation.value, 1) && (donation.accountId === undefined || typeof donation.accountId === 'string');
}

function isVenueTutorials(value: unknown): boolean {
  return isRecord(value) && Object.entries(value).every(([type, step]) => (VENUE_TUTORIAL_TYPES as string[]).includes(type) && (step === null || isVenueTutorialStep(type, step)));
}

function structureFailure(value: Json): string | null {
  const parcelMax = GAME_CONFIG.mapSizeInParcels - 1;
  return firstFailure([
    field('seed', () => typeof value.seed === 'string'),
    field('rngState', () => isNumber(value.rngState)),
    field('urbs', () => isNonNegative(value.urbs)),
    field('lastSeen', () => isNumber(value.lastSeen)),
    field('nextId', () => isInt(value.nextId, 1)),
    entries('ownedParcels', () => value.ownedParcels, (parcel) => isCoord(parcel, parcelMax)),
    entries('buildings', () => value.buildings, isBuilding),
    field('storage', () => isRecord(value.storage)),
    field('storage.materials', () => isAmountRecord((value.storage as Json).materials, Object.keys(MATERIALS))),
    field('storage.goods', () => isAmountRecord((value.storage as Json).goods, Object.keys(GOODS))),
    field('seedStock', () => isRecord(value.seedStock) && Object.values(value.seedStock).every((amount) => isInt(amount, 0))),
    entries('fields', () => value.fields, isFieldTile),
    field('marketUnlocked', () => typeof value.marketUnlocked === 'boolean'),
    field('market', () => isMarket(value.market)),
    entries('roads', () => value.roads, (road) => isCoord(road) && ROAD_KINDS.includes((road as Json).kind as string) && ((road as Json).tier === undefined || isInt((road as Json).tier, 1, MAX_ROAD_TIER))),
    entries('pedestrianWays', () => value.pedestrianWays, (tile) => isRecord(tile) && isCoord(tile) && (tile.tier === undefined || isInt(tile.tier, 1, MAX_ROAD_TIER)), true),
    entries('roundabouts', () => value.roundabouts, (center) => isCoord(center)),
    field('tutorial', () => value.tutorial === null || TUTORIAL_STEPS.includes(value.tutorial as TutorialStep)),
    entries('tradeLedger', () => value.tradeLedger, isTradeLedgerEntry),
    field('venueTutorials', () => value.venueTutorials === undefined || isVenueTutorials(value.venueTutorials)),
    field('solidarityMs', () => value.solidarityMs === undefined || (isNonNegative(value.solidarityMs) && value.solidarityMs <= SOLIDARITY_MAX_MS)),
    entries('donations', () => value.donations, isDonation, true),
    field('donations: duplicate id', () => !Array.isArray(value.donations) || !hasDuplicates((value.donations as { id: string }[]).map((donation) => donation.id))),
    field('timeOffset', () => value.timeOffset === undefined || (isNonNegative(value.timeOffset) && value.timeOffset <= Number.MAX_SAFE_INTEGER)),
    field('dayCycleOffset', () => value.dayCycleOffset === undefined || (isNonNegative(value.dayCycleOffset) && value.dayCycleOffset < 2 * 3_600_000)),
    field('adaptationUntil', () => value.adaptationUntil === undefined || isNumber(value.adaptationUntil)),
    entries('waterTiles', () => value.waterTiles, (tile) => isRecord(tile) && isCoord(tile), true),
    field('waterTiles: duplicate tile', () => value.waterTiles === undefined || !hasDuplicates((value.waterTiles as { x: number; y: number }[]).map(tileKey))),
    entries('boats', () => value.boats, isBoat, true),
    entries('bridges', () => value.bridges, isBridge, true),
    field('casinoRng', () => value.casinoRng === undefined || isNumber(value.casinoRng)),
    field('difficulty', () => value.difficulty === undefined || isDifficulty(value.difficulty)),
    field('politics', () => value.politics === undefined || (isRecord(value.politics) && isNumber(value.politics.rngState) && isNumber(value.politics.approval) && value.politics.approval >= 0 && value.politics.approval <= 100 && isNumber(value.politics.shock) && isInt(value.politics.day, 0) && isPoliticsCouncil(value.politics) && isPoliticsObjectives(value.politics) && isPoliticsPetitions(value.politics) && isPoliticsTerm(value.politics) && isPoliticsJournal(value.politics))),
    field('challenge', () => value.challenge === undefined || isChallengeProgress(value.challenge)),
    entries('challengeClaims', () => value.challengeClaims, isChallengeClaim, true),
    field('ecologyDismissed', () => value.ecologyDismissed === undefined || typeof value.ecologyDismissed === 'boolean'),
    entries('busLines', () => value.busLines, isBusLine, true),
    ...(['brtRoads', 'rails'] as const).flatMap((key) => [
      entries(key, () => value[key], isTransitTile(key), true),
      field(`${key}: duplicate tile`, () => value[key] === undefined || !hasDuplicates((value[key] as { x: number; y: number }[]).map(tileKey))),
    ]),
    entries('transitLines', () => value.transitLines, isTransitLine, true),
    entries('transitFleet', () => value.transitFleet, isTransitVehicle, true),
  ]);
}

function isStopOfKind(state: GameState, id: number, allowed: BuildingType[]): boolean {
  const building = state.buildings.find((candidate) => candidate.id === id);
  return id < state.nextId && (building === undefined || allowed.includes(building.type));
}

function carrierKeys(state: GameState, bridge: { carrier?: 'road' | 'brt' | 'pedestrian' }): Set<string> {
  return new Set((bridge.carrier === 'brt' ? (state.brtRoads ?? []) : state.roads).map(tileKey));
}

function invariantFailure(state: GameState): string | null {
  const ids = [...state.buildings.map((b) => b.id), ...(state.boats ?? []).map((b) => b.id), ...(state.busLines ?? []).map((l) => l.id), ...(state.transitLines ?? []).map((l) => l.id), ...(state.transitFleet ?? []).map((v) => v.id)];
  const roadKeys = new Set(state.roads.map(tileKey));
  const pedestrianWays = (state.pedestrianWays ?? []).map(tileKey);
  const waterKeys = new Set((state.waterTiles ?? []).map(tileKey));
  const bridged = new Set<string>();
  return firstFailure([
    field('ids: duplicate', () => !hasDuplicates(ids.map(String))),
    field('ids: at or above nextId', () => ids.every((id) => id < state.nextId)),
    field('pedestrianWays: duplicate tile', () => !hasDuplicates(pedestrianWays)),
    field('pedestrianWays: overlaps a road', () => pedestrianWays.every((key) => !roadKeys.has(key))),
    ...(state.bridges ?? []).flatMap((bridge, index) => {
      const keys = bridgeFootprint(bridge).map(tileKey);
      const overlapping = keys.some((key) => bridged.has(key));
      keys.forEach((key) => bridged.add(key));
      if (isInfrastructureBridge(bridge)) {
        return [
          field(`bridges[${index}]: overlaps another bridge`, () => !overlapping),
          field(`bridges[${index}]: a ramp has another tier than the bridge`, () => bridge.carrier !== 'road' || bridgeRamps(bridge).every((tile) => (state.roads.find((road) => tileKey(road) === tileKey(tile))?.tier ?? 1) === (bridge.tier ?? 1))),
          field(`bridges[${index}]: a ramp is not on its carrier`, () => bridgeRamps(bridge).every((tile) => carrierKeys(state, bridge).has(tileKey(tile)))),
        ];
      }
      return [
        field(`bridges[${index}]: overlaps another bridge`, () => !overlapping),
        field(`bridges[${index}]: crosses a tile without a road`, () => keys.every((key) => roadKeys.has(key))),
        field(`bridges[${index}]: crosses a tile that is not water`, () => keys.every((key) => waterKeys.has(key))),
      ];
    }),
    ...(state.boats ?? []).flatMap((boat, index) => [
      field(`boats[${index}]: not on a water tile`, () => waterKeys.has(tileKey(boat))),
      field(`boats[${index}]: its marina does not exist`, () => state.buildings.some((b) => b.id === boat.marinaId && b.type === 'marina')),
    ]),
    field('boats: two on one tile', () => !hasDuplicates((state.boats ?? []).map(tileKey))),
    ...(state.busLines ?? []).map((line, index) => field(`busLines[${index}]: a stop is unknown or not a bus stop or hub`, () => line.stops.every((id) => isStopOfKind(state, id, ['busStop', 'transitHub'])))),
    ...(state.transitLines ?? []).map((line, index) => {
      const station = line.mode === 'brt' ? 'brtStation' : 'railStation';
      return field(`transitLines[${index}]: a stop is unknown or not a ${station} or hub`, () => line.stops.every((id) => isStopOfKind(state, id, [station, 'transitHub'])));
    }),
    ...(state.transitFleet ?? []).map((vehicle, index) =>
      field(`transitFleet[${index}]: its line is missing or of another mode`, () => {
        if (vehicle.lineId === undefined) return true;
        const line = state.transitLines?.find((candidate) => candidate.id === vehicle.lineId);
        return line !== undefined && line.mode === TRANSIT[vehicle.kind].mode;
      }),
    ),
  ]);
}

export function checkGameState(value: unknown): StateCheck {
  if (!isRecord(value)) return { ok: false, reason: 'state: expected an object' };
  const reason = structureFailure(value) ?? invariantFailure(value as unknown as GameState);
  return reason ? { ok: false, reason } : { ok: true, state: value as unknown as GameState };
}

export function validateGameState(value: unknown): GameState | null {
  const check = checkGameState(value);
  return check.ok ? check.state : null;
}
