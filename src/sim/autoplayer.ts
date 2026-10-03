import {
  GOODS,
  MATERIALS,
  SHOP,
  SLOT_PRICES,
  autoRotation,
  isItemUnlocked,
  marketPoints,
  maxTierOf,
  minTierOf,
  placementIssue,
  producibleItems,
  productionTierOf,
  recipeOf,
  storageCapacity,
  storageUsed,
  taxDue,
  totalCitizens,
  upgradeCostOf,
  utilityCapacity,
  utilityDemand,
  type Building,
  type BuildingType,
  type Command,
  type Coord,
  type GameState,
  type GoodId,
  type ItemId,
  type MaterialId,
} from '../core';

export interface Player {
  state(): GameState;
  send(command: Command): string | null;
}

const HOUR_MS = 3_600_000;
const MAX_ACTIONS_PER_TURN = 60;
const MAX_UTILITIES = 10;
const MARKET_SELL_FLOOR_POINTS = 45;
const MARKET_BATCH = 6;
const GOODS_STOCK_CAP = 30;
const MATERIAL_BASELINE = 8;
const NEED_LOOKAHEAD = 4;
const IDLE_SKIP_HOURS = 0.25;
const MIN_SKIP_HOURS = 1 / 60;
const MAX_SKIP_HOURS = 3;

const row = (fromX: number, toX: number, y: number, step = 2): Coord[] => {
  const tiles: Coord[] = [];
  for (let x = fromX; x <= toX; x += step) tiles.push({ x, y });
  return tiles;
};

const PRODUCTION_SLOTS = [...row(50, 76, 56), ...row(50, 76, 66)];

const SLOTS: Partial<Record<BuildingType, Coord[]>> = {
  workshop: PRODUCTION_SLOTS,
  factory: PRODUCTION_SLOTS,
  home: [...row(50, 54, 59), ...row(62, 76, 59), ...row(50, 76, 69)],
  shop: [60, 62, 64, 66].map((y) => ({ x: 48, y })),
  storehouse: [{ x: 56, y: 59 }],
  silo: [{ x: 58, y: 59 }],
  vault: [{ x: 60, y: 59 }],
  powerPlant: row(50, 59, 76, 1),
  waterTower: row(50, 59, 78, 1),
};

const ROADS = {
  main: { from: { x: 49, y: 58 }, to: { x: 78, y: 58 }, horizontalFirst: true },
  link: { from: { x: 49, y: 58 }, to: { x: 49, y: 68 }, horizontalFirst: false },
  second: { from: { x: 49, y: 68 }, to: { x: 78, y: 68 }, horizontalFirst: true },
};

export function isGoalReached(state: GameState): boolean {
  return state.buildings.some((building) => building.type === 'home' && building.tier >= maxTierOf('home'));
}

const countOf = (state: GameState, type: BuildingType): number => state.buildings.filter((building) => building.type === type).length;

const topHomeTier = (state: GameState): number => Math.max(1, ...state.buildings.filter((building) => building.type === 'home').map((building) => building.tier));

function targetCount(state: GameState, type: BuildingType): number {
  const stage = topHomeTier(state);
  if (type === 'storehouse') return 1;
  if (type === 'workshop' || type === 'factory') return Math.min(4, 2 + Math.floor(stage / 2));
  if (type === 'home') return Math.min(8, 1 + stage);
  if (type === 'shop') return stage >= 2 ? Math.min(3, stage - 1) : 0;
  return 0;
}

function build(player: Player, type: BuildingType): 'built' | 'poor' | 'none' {
  const state = player.state();
  for (const slot of SLOTS[type] ?? []) {
    const rotation = autoRotation(state, type, slot.x, slot.y);
    const issue = placementIssue(state, type, slot.x, slot.y, rotation);
    if (issue === 'error.notEnoughUrbs') return 'poor';
    if (issue !== null) continue;
    return player.send({ type: 'PlaceBuilding', buildingType: type, x: slot.x, y: slot.y, rotation }) === null ? 'built' : 'none';
  }
  return 'none';
}

function buildRoads(player: Player, which: keyof typeof ROADS): boolean {
  return player.send({ type: 'BuildRoad', ...ROADS[which] }) === null;
}

function hasRoadRow(state: GameState, y: number): boolean {
  return state.roads.some((road) => road.y === y && road.x === 78);
}

function buildNext(player: Player): boolean {
  const state = player.state();
  if (countOf(state, 'storehouse') === 0) return build(player, 'storehouse') === 'built';
  if (!hasRoadRow(state, 58)) return buildRoads(player, 'main') && buildRoads(player, 'link');

  for (const type of ['workshop', 'factory', 'home', 'shop'] as const) {
    if (countOf(player.state(), type) >= targetCount(player.state(), type)) continue;
    const result = build(player, type);
    if (result === 'built') return true;
    if (result === 'poor') return false;
    if (!hasRoadRow(player.state(), 68) && buildRoads(player, 'second')) return true;
    if (type === 'home' && ensureUtility(player, 'both')) return true;
  }
  return buildStorage(player);
}

function buildStorage(player: Player): boolean {
  const state = player.state();
  const capacity = storageCapacity(state);
  const used = storageUsed(state.storage);
  if (countOf(state, 'silo') === 0 && used.materials >= capacity.materials * 0.9 && build(player, 'silo') === 'built') return true;
  return countOf(state, 'vault') === 0 && used.goods >= capacity.goods * 0.9 && build(player, 'vault') === 'built';
}

function ensureUtility(player: Player, which: 'power' | 'water' | 'both'): boolean {
  const state = player.state();
  const capacity = utilityCapacity(state);
  const demand = utilityDemand(state);
  const forced = which !== 'both';
  const kinds: ('powerPlant' | 'waterTower')[] = [];
  if (which !== 'water' && (forced || capacity.power <= demand.power + 1)) kinds.push('powerPlant');
  if (which !== 'power' && (forced || capacity.water <= demand.water + 1)) kinds.push('waterTower');
  return kinds.some((kind) => growUtility(player, kind));
}

function growUtility(player: Player, kind: 'powerPlant' | 'waterTower'): boolean {
  const state = player.state();
  if (countOf(state, kind) < MAX_UTILITIES) return build(player, kind) === 'built';
  const weakest = state.buildings.filter((building) => building.type === kind).sort((a, b) => a.tier - b.tier)[0];
  if (!weakest || weakest.tier >= maxTierOf(kind)) return false;
  return player.send({ type: 'UpgradeBuilding', buildingId: weakest.id }) === null;
}

interface Candidate {
  building: Building;
  urbs: number;
  goods: Partial<Record<GoodId, number>>;
}

function isWeakestTightUtility(state: GameState, building: Building): boolean {
  const kind = building.type === 'powerPlant' ? 'power' : 'water';
  const capacity = utilityCapacity(state)[kind];
  const demand = utilityDemand(state)[kind];
  if (capacity >= demand * 1.3 + 6 || countOf(state, building.type) < MAX_UTILITIES) return false;
  const weakest = Math.min(...state.buildings.filter((candidate) => candidate.type === building.type).map((candidate) => candidate.tier));
  return building.tier === weakest;
}

function upgradeCandidates(state: GameState): Candidate[] {
  const capacity = storageCapacity(state);
  const used = storageUsed(state.storage);
  const storageIsTight = used.materials >= capacity.materials * 0.7 || used.goods >= capacity.goods * 0.7;
  const candidates: Candidate[] = [];
  for (const building of state.buildings) {
    if (building.tier >= maxTierOf(building.type)) continue;
    if ((building.type === 'powerPlant' || building.type === 'waterTower') && !isWeakestTightUtility(state, building)) continue;
    if ((building.type === 'storehouse' || building.type === 'silo' || building.type === 'vault') && !storageIsTight) continue;
    const cost = upgradeCostOf(building.type, building.tier + 1);
    if (cost) candidates.push({ building, urbs: cost.urbs, goods: cost.goods });
  }
  return candidates.sort((a, b) => a.urbs - b.urbs);
}

function canAfford(state: GameState, candidate: Candidate): boolean {
  if (state.urbs < candidate.urbs) return false;
  return Object.entries(candidate.goods).every(([good, amount]) => (state.storage.goods[good as GoodId] ?? 0) >= amount);
}

function upgradeNext(player: Player, blocked: Set<number>): boolean {
  const state = player.state();
  for (const candidate of upgradeCandidates(state)) {
    if (blocked.has(candidate.building.id) || !canAfford(state, candidate)) continue;
    const error = player.send({ type: 'UpgradeBuilding', buildingId: candidate.building.id });
    if (error === null) return true;
    if (error === 'error.notEnoughPower' && ensureUtility(player, 'power')) return true;
    if (error === 'error.notEnoughWater' && ensureUtility(player, 'water')) return true;
    blocked.add(candidate.building.id);
  }
  return false;
}

function buySlots(player: Player): boolean {
  const state = player.state();
  for (const building of state.buildings) {
    if (building.type !== 'workshop' && building.type !== 'factory') continue;
    if (building.slotCount >= productionTierOf(building).maxSlots) continue;
    const price = SLOT_PRICES[building.slotCount + 1] ?? Infinity;
    if (state.urbs >= price * 3 && player.send({ type: 'BuySlot', buildingId: building.id }) === null) return true;
  }
  return false;
}

function collectAll(player: Player): void {
  for (const building of player.state().buildings) {
    const ready = building.queue.some((entry) => entry.done) || building.stacks.some((stack) => stack.earned > 0) || taxDue(building) > 0;
    if (ready) player.send({ type: 'Collect', buildingId: building.id });
  }
}

type Needs = Partial<Record<GoodId, number>>;

function goodsNeeded(state: GameState): { missing: Needs; reserved: Needs } {
  const missing: Needs = {};
  const reserved: Needs = {};
  for (const candidate of upgradeCandidates(state).slice(0, NEED_LOOKAHEAD)) {
    for (const [good, amount] of Object.entries(candidate.goods) as [GoodId, number][]) {
      reserved[good] = (reserved[good] ?? 0) + amount;
      missing[good] = Math.max(0, (reserved[good] ?? 0) - (state.storage.goods[good] ?? 0));
    }
  }
  return { missing, reserved };
}

const canProduce = (state: GameState, building: Building, item: ItemId): boolean =>
  producibleItems(building.type).includes(item) && isItemUnlocked(state, item) && building.tier >= minTierOf(item);

function materialsAvailable(state: GameState, good: GoodId): boolean {
  return Object.entries(recipeOf(good)).every(([material, amount]) => (state.storage.materials[material as MaterialId] ?? 0) >= amount);
}

function profitRate(building: Building, good: GoodId): number {
  const { durationFactor, yield: quantity } = productionTierOf(building);
  return (GOODS[good].value * quantity) / (GOODS[good].durationMs * durationFactor);
}

function queueGoods(player: Player, missing: Needs, reserved: Needs): Set<MaterialId> {
  const wantedMaterials = new Set<MaterialId>();
  for (const factory of player.state().buildings.filter((building) => building.type === 'factory')) {
    while (player.state().buildings.find((building) => building.id === factory.id)!.queue.length < factory.slotCount) {
      const state = player.state();
      const current = state.buildings.find((building) => building.id === factory.id)!;
      const goods = (Object.keys(GOODS) as GoodId[]).filter((good) => canProduce(state, current, good));
      const needed = goods.filter((good) => (missing[good] ?? 0) > 0);
      const profitable = goods
        .filter((good) => (state.storage.goods[good] ?? 0) - (reserved[good] ?? 0) < GOODS_STOCK_CAP)
        .sort((a, b) => profitRate(current, b) - profitRate(current, a));
      const choice = [...needed, ...profitable].find((good) => materialsAvailable(state, good));
      const target = needed[0] ?? profitable[0];
      if (target && !choice) for (const material of Object.keys(recipeOf(target)) as MaterialId[]) wantedMaterials.add(material);
      if (!choice) break;
      if (player.send({ type: 'QueueProduction', buildingId: factory.id, item: choice }) !== null) break;
      if (needed.includes(choice)) missing[choice] = Math.max(0, (missing[choice] ?? 0) - productionTierOf(current).yield);
    }
  }
  return wantedMaterials;
}

function queueMaterials(player: Player, wanted: Set<MaterialId>): void {
  for (const workshop of player.state().buildings.filter((building) => building.type === 'workshop')) {
    while (player.state().buildings.find((building) => building.id === workshop.id)!.queue.length < workshop.slotCount) {
      const state = player.state();
      const current = state.buildings.find((building) => building.id === workshop.id)!;
      const capacity = storageCapacity(state).materials;
      const used = storageUsed(state.storage).materials + state.buildings.reduce((total, building) => total + building.queue.filter((entry) => !entry.done && entry.item in MATERIALS).length, 0);
      if (used >= capacity) return;
      const pending = (material: MaterialId) =>
        state.buildings.reduce((total, building) => total + building.queue.filter((entry) => !entry.done && entry.item === material).length, 0);
      const stock = (material: MaterialId) => (state.storage.materials[material] ?? 0) + pending(material);
      const materials = (Object.keys(MATERIALS) as MaterialId[]).filter((material) => canProduce(state, current, material));
      const urgent = materials.filter((material) => wanted.has(material) && stock(material) < MATERIAL_BASELINE * 2);
      const baseline = materials.filter((material) => stock(material) < MATERIAL_BASELINE);
      const pick = (list: MaterialId[]) => list.sort((a, b) => stock(a) - stock(b))[0];
      const choice = pick(urgent) ?? pick(baseline);
      if (!choice || player.send({ type: 'QueueProduction', buildingId: workshop.id, item: choice }) !== null) return;
    }
  }
}

function sellSurplus(player: Player, reserved: Needs): void {
  const state = player.state();
  const surplus = (good: GoodId) => (state.storage.goods[good] ?? 0) - (reserved[good] ?? 0);
  const byValue = (Object.keys(GOODS) as GoodId[]).sort((a, b) => GOODS[b].value - GOODS[a].value);

  for (const shop of state.buildings.filter((building) => building.type === 'shop')) {
    for (let index = 0; index < shop.stacks.length; index++) {
      const current = player.state();
      const stock = (good: GoodId) => (current.storage.goods[good] ?? 0) - (reserved[good] ?? 0);
      const good = byValue.find((candidate) => stock(candidate) >= SHOP.stackSize);
      if (!good || shop.stacks[index]!.stock > 0) continue;
      player.send({ type: 'StockShop', buildingId: shop.id, good });
    }
  }
  if (!state.marketUnlocked) return;
  for (const good of byValue) {
    const quantity = Math.min(surplus(good), MARKET_BATCH, player.state().storage.goods[good] ?? 0);
    if (quantity <= 0 || marketPoints(player.state(), good, player.state().lastSeen) < MARKET_SELL_FLOOR_POINTS) continue;
    player.send({ type: 'SellToMarket', good, quantity });
  }
}

function hoursUntilNextCompletion(state: GameState): number {
  const remaining = state.buildings.flatMap((building) => {
    const running = building.queue.find((entry) => !entry.done);
    return running?.startedAt == null ? [] : [running.startedAt + running.duration - state.lastSeen];
  });
  if (remaining.length === 0) return IDLE_SKIP_HOURS;
  return Math.min(MAX_SKIP_HOURS, Math.max(MIN_SKIP_HOURS, Math.min(...remaining) / HOUR_MS));
}

export function playTurn(player: Player): number {
  collectAll(player);
  const blocked = new Set<number>();
  for (let action = 0; action < MAX_ACTIONS_PER_TURN; action++) {
    const state = player.state();
    if ((totalCitizens(state) > 0 || state.lastSeen >= (state.adaptationUntil ?? 0)) && ensureUtility(player,'both')) continue;
    if (!buildNext(player) && !upgradeNext(player, blocked) && !buySlots(player)) break;
  }
  const { missing, reserved } = goodsNeeded(player.state());
  const wantedMaterials = queueGoods(player, missing, { ...reserved });
  queueMaterials(player, wantedMaterials);
  sellSurplus(player, reserved);

  const hours = hoursUntilNextCompletion(player.state());
  player.send({ type: 'SkipTime', hours });
  return hours;
}

export function describeProgress(state: GameState): string {
  const homes = state.buildings.filter((building) => building.type === 'home').map((building) => building.tier);
  return `${homes.length} homes · top Tier ${Math.max(0, ...homes)} · ${totalCitizens(state)} Citizens · ${state.urbs} Urbs`;
}
