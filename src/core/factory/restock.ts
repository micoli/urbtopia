import { advanceBuilding, newQueueEntry, recipeMultiplierOf } from '../economy/production';
import { compartmentOf, hasStorage, storageCapacity, storageUsed } from '../economy/storage';
import { isGood, isMaterial, minTierOf, producibleItems, recipeOf } from '../economy/items';
import { isItemUnlocked } from '../progression/unlocks';
import type { CommandOutcome } from '../engine/commands';
import type { GameEvent } from '../engine/events';
import type { Building, GameState, QueueEntry, VenueFixture } from '../engine/state';
import { linkedExitsOf } from './factoryFloor';
import { restockerWagePerHour } from './floorWear';

// Queues one production of an item in a building, taking its ingredients from the Storehouse; an entry queued for an Exit's Restocker carries the Exit.
export function queueItem(state: GameState, building: Building, item: string, now: number, exitId?: number): CommandOutcome {
  if (!(isMaterial(item) || isGood(item)) || !producibleItems(building.type).includes(item)) return { key: 'error.cannotProduce' };
  if (!isItemUnlocked(state, item)) return { key: 'error.itemLocked' };
  if (building.tier < minTierOf(item)) return { key: 'error.tierTooLow' };
  if (building.queue.length >= building.slotCount) return { key: 'error.queueFull' };
  const materials = { ...state.storage.materials };
  const recipeMultiplier = recipeMultiplierOf(building);
  for (const [material, needed] of Object.entries(recipeOf(item))) {
    const required = needed * recipeMultiplier;
    const available = materials[material as keyof typeof materials] ?? 0;
    if (available < required) return { key: 'error.missingMaterials' };
    materials[material as keyof typeof materials] = available - required;
  }
  const queued = newQueueEntry(building, item, now);
  const entry: QueueEntry = exitId === undefined ? queued.entry : { ...queued.entry, exitId };
  return {
    state: {
      ...state,
      storage: { ...state.storage, materials },
      buildings: state.buildings.map((candidate) => (candidate === building ? { ...queued.building, queue: [...building.queue, entry] } : candidate)),
    },
    events: [],
  };
}

const isError = (outcome: CommandOutcome): outcome is Extract<CommandOutcome, { key: string }> => 'key' in outcome;

// The Packhouse keeps its last free Slot for the player.
const RESERVED_SLOTS = 1;

// The Exits whose Restocker is at work: a Restocker for each, a Restock and a Line that is Linked. The layout results are cached by layout, so the Exits are read from the floor itself.
const workingExitsOf = (building: Building, urbs: number): VenueFixture[] => {
  const hired = building.floor?.restockers ?? 0;
  if (!building.floor || urbs < hired * restockerWagePerHour()) return [];
  const linked = new Set(linkedExitsOf(building.floor.fixtures).map((exit) => exit.id));
  return building.floor.fixtures.filter((fixture) => linked.has(fixture.id) && fixture.restocker && fixture.restock).sort((a, b) => a.id - b.id).slice(0, hired);
};

// Puts a finished entry into the Storehouse; false when there is no room for it.
function store(state: GameState, entry: QueueEntry): GameState | null {
  if (!hasStorage(state)) return null;
  const compartment = compartmentOf(entry.item);
  if (storageUsed(state.storage)[compartment] + entry.quantity > storageCapacity(state)[compartment]) return null;
  const materials = { ...state.storage.materials };
  const goods = { ...state.storage.goods };
  if (isMaterial(entry.item)) materials[entry.item] = (materials[entry.item] ?? 0) + entry.quantity;
  else goods[entry.item] = (goods[entry.item] ?? 0) + entry.quantity;
  return { ...state, storage: { materials, goods }, marketUnlocked: state.marketUnlocked || Object.values(goods).some((amount) => (amount ?? 0) > 0) };
}

const withBuilding = (state: GameState, building: Building): GameState => ({ ...state, buildings: state.buildings.map((candidate) => (candidate.id === building.id ? building : candidate)) });

const withFixture = (state: GameState, buildingId: number, replacement: VenueFixture): GameState => {
  const building = state.buildings.find((candidate) => candidate.id === buildingId)!;
  return withBuilding(state, { ...building, floor: { ...building.floor!, fixtures: building.floor!.fixtures.map((fixture) => (fixture.id === replacement.id ? replacement : fixture)) } });
};

// One turn of the Restockers of a Packhouse: every Exit stores its finished production, then the Exits served longest ago queue the next ones in the Slots left.
function restockTurn(state: GameState, buildingId: number): { state: GameState; changed: boolean; blocked: boolean } {
  let current = state;
  let changed = false;
  let blocked = false;
  let freedAt = state.lastSeen;
  const exits = workingExitsOf(state.buildings.find((candidate) => candidate.id === buildingId)!, state.urbs);
  for (const exit of exits) {
    const building = current.buildings.find((candidate) => candidate.id === buildingId)!;
    const finished = building.queue.find((entry) => entry.exitId === exit.id && entry.item === exit.restock && entry.done);
    if (!finished) continue;
    const stored = store(current, finished);
    if (!stored) {
      blocked = true;
      continue;
    }
    current = withBuilding(stored, { ...building, queue: building.queue.filter((entry) => entry !== finished) });
    freedAt = (finished.startedAt ?? 0) + finished.duration;
    changed = true;
  }
  const turns = [...exits].sort((a, b) => (a.restockedAt ?? -Infinity) - (b.restockedAt ?? -Infinity) || a.id - b.id);
  for (const exit of turns) {
    const building = current.buildings.find((candidate) => candidate.id === buildingId)!;
    if (building.queue.some((entry) => entry.exitId === exit.id && entry.item === exit.restock)) continue;
    if (building.queue.length >= building.slotCount - RESERVED_SLOTS) continue;
    const queued = queueItem(current, building, exit.restock!, freedAt, exit.id);
    if (isError(queued)) continue;
    current = withFixture(queued.state, buildingId, { ...exit, restockedAt: freedAt });
    changed = true;
  }
  return { state: current, changed, blocked };
}

// Runs the Restockers of every Packhouse up to `now`, one production after the other, so that a long absence gives what the same time played would.
export function advanceRestockers(state: GameState, now: number): { state: GameState; events: GameEvent[] } {
  const ids = state.buildings.filter((building) => building.type === 'packhouse' && workingExitsOf(building, state.urbs).length > 0).map((building) => building.id);
  if (ids.length === 0) return { state, events: [] };
  let current = state;
  const events: GameEvent[] = [];
  for (const id of ids) {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const result = restockTurn(current, id);
      if (result.blocked && turn === 0) events.push({ type: 'StorageFull', buildingId: id });
      if (!result.changed) break;
      const building = result.state.buildings.find((candidate) => candidate.id === id)!;
      const advanced = advanceBuilding(building, now);
      events.push(...advanced.events);
      current = withBuilding(result.state, advanced.building);
    }
  }
  return { state: current, events };
}

const MAX_TURNS = 5000;
