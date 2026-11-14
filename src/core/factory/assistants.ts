import { emptyStack, stacksOf } from '../buildings/buildingSpecs';
import { SHOP } from '../economy/economy';
import { advanceBuilding } from '../economy/production';
import { saleIntervalOf } from '../economy/shops';
import { assignedRoleOf, hasAssignments, workFocusOf } from '../interiors/interiorAssignments';
import { interiorLayoutOf, isProducerRole } from '../interiors/interiorStaff';
import type { GameEvent } from '../engine/events';
import type { Building, GameState, ShopStack, VenueFixture } from '../engine/state';
import type { GoodId } from '../economy/items';
import { interiorLinksOf, suppliedGoodsOf } from './factoryInterior';
import { MAX_TURNS, RESERVED_SLOTS, isError, queueItem, store, withBuilding, withFixture } from './restock';

// The Fixtures the Staff of a Bakery or a Dairy is at work on: assigned, with their Recipe or their Sold Good, and reached by the Line. The layout results are cached by layout, so the Fixtures are read from the interior.
const workingOf = (building: Building, role: 'producer' | 'seller'): VenueFixture[] => workingWithGoodOf(building, role).map(({ fixture }) => fixture);

// The same Fixtures with the Good each one works on: for a Storage bin, the item picked on the Extractor that feeds it.
const workingWithGoodOf = (building: Building, role: 'producer' | 'seller'): { fixture: VenueFixture; good: GoodId }[] => {
  if (!building.interior) return [];
  const fixtures = building.interior.fixtures;
  const { lined } = interiorLinksOf(fixtures);
  return fixtures
    .filter(fixture => fixture.assigned === true && assignedRoleOf(fixture) !== undefined && isProducerRole(assignedRoleOf(fixture)) === (role === 'producer') && lined.has(fixture.id) && (role === 'producer' || suppliedGoodsOf(fixtures, fixture).has(fixture.soldGood!)))
    .flatMap(fixture => {
      const good = workFocusOf(fixtures, fixture);
      return good === undefined ? [] : [{ fixture, good }];
    })
    .sort((a, b) => a.fixture.id - b.fixture.id);
};

// A line takes longer for each other line at work: the Ovens share the Tier's pace instead of each running at the full one.
const lineFactorOf = (building: Building, lines: number): number => 1 + (interiorLayoutOf(building.type)?.laneSlowdown ?? 0) * Math.max(0, lines - 1);

// One turn of the bakers: every Oven stores its finished production, then the Ovens served longest ago queue the next one in the Slots left, as the Restockers of a Packhouse do.
function bakerTurn(state: GameState, buildingId: number): { state: GameState; changed: boolean; blocked: boolean } {
  let current = state;
  let changed = false;
  let blocked = false;
  let freedAt = state.lastSeen;
  const working = workingWithGoodOf(state.buildings.find(candidate => candidate.id === buildingId)!, 'producer');
  const ovens = working.map(({ fixture }) => fixture);
  const goodOf = new Map(working.map(({ fixture, good }) => [fixture.id, good]));
  for (const oven of ovens) {
    const building = current.buildings.find(candidate => candidate.id === buildingId)!;
    const finished = building.queue.find(entry => entry.exitId === oven.id && entry.item === goodOf.get(oven.id) && entry.done);
    if (!finished) continue;
    const stored = store(current, finished);
    if (!stored) {
      blocked = true;
      continue;
    }
    current = withBuilding(stored, { ...building, queue: building.queue.filter(entry => entry !== finished) });
    freedAt = (finished.startedAt ?? 0) + finished.duration;
    changed = true;
  }
  const turns = [...ovens].sort((a, b) => (a.restockedAt ?? -Infinity) - (b.restockedAt ?? -Infinity) || a.id - b.id);
  for (const oven of turns) {
    const building = current.buildings.find(candidate => candidate.id === buildingId)!;
    if (building.queue.some(entry => entry.exitId === oven.id && entry.item === goodOf.get(oven.id))) continue;
    if (building.queue.length >= building.slotCount - RESERVED_SLOTS) continue;
    const queued = queueItem(current, building, goodOf.get(oven.id)!, freedAt, oven.id, lineFactorOf(building, ovens.length));
    if (isError(queued)) continue;
    current = withFixture(queued.state, buildingId, { ...oven, restockedAt: freedAt });
    changed = true;
  }
  return { state: current, changed, blocked };
}

// The sellers pay out what the sold-out stacks earned, then keep each Sold Good on the Counter: a Display counter with a seller has a stack of its Good stocked from the Storehouse.
function sellerTurn(state: GameState, buildingId: number, now: number): { state: GameState; changed: boolean } {
  let current = state;
  let changed = false;
  const counters = workingOf(state.buildings.find(candidate => candidate.id === buildingId)!, 'seller');
  if (counters.length === 0) return { state, changed };
  const building = { ...state.buildings.find(candidate => candidate.id === buildingId)! };
  building.stacks = stacksOf(building);
  if (building.stacks.some(stack => stack.good !== null && stack.stock === 0 && stack.earned > 0)) {
    const earned = building.stacks.reduce((total, stack) => total + stack.earned, 0);
    const remaining = building.stacks.filter(stack => stack.stock > 0).map(stack => ({ ...stack, earned: 0 }));
    const stacks: ShopStack[] = [...remaining, ...Array.from({ length: building.stacks.length - remaining.length }, emptyStack)];
    current = withBuilding({ ...current, urbs: current.urbs + earned }, { ...building, stacks });
    changed = true;
  }
  for (const good of [...new Set(counters.map(counter => counter.soldGood!))] as GoodId[]) {
    const found = current.buildings.find(candidate => candidate.id === buildingId)!;
    const shop = { ...found, stacks: stacksOf(found) };
    const wanted = counters.filter(counter => counter.soldGood === good).length;
    const stocked = shop.stacks.filter(stack => stack.good === good && stack.stock > 0).length;
    const slot = shop.stacks.findIndex(stack => stack.stock === 0);
    const available = current.storage.goods[good] ?? 0;
    if (stocked >= wanted || slot === -1 || available < SHOP.stackSize) continue;
    const selling = shop.stacks.some(stack => stack.stock > 0);
    const stacks = shop.stacks.map((stack, index) => (index === slot ? { ...stack, good, stock: SHOP.stackSize, nextSaleAt: selling ? null : now + saleIntervalOf(shop, good) } : stack));
    current = withBuilding({ ...current, storage: { ...current.storage, goods: { ...current.storage.goods, [good]: available - SHOP.stackSize } } }, { ...shop, stacks });
    changed = true;
  }
  return { state: current, changed };
}

const SELLER_TURNS = 20;

// Runs the bakers and the sellers of every Bakery up to `now`, one production after the other, so that a long absence gives what the same time played would.
export function advanceAssistants(state: GameState, now: number): { state: GameState; events: GameEvent[] } {
  const ids = state.buildings.filter(building => hasAssignments(building) && building.interior && building.interior.fixtures.some(fixture => fixture.assigned === true)).map(building => building.id);
  if (ids.length === 0) return { state, events: [] };
  let current = state;
  const events: GameEvent[] = [];
  for (const id of ids) {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const result = bakerTurn(current, id);
      if (result.blocked && turn === 0) events.push({ type: 'StorageFull', buildingId: id });
      if (!result.changed) break;
      const building = result.state.buildings.find(candidate => candidate.id === id)!;
      const advanced = advanceBuilding(building, now);
      events.push(...advanced.events);
      current = withBuilding(result.state, advanced.building);
    }
    for (let turn = 0; turn < SELLER_TURNS; turn++) {
      const result = sellerTurn(current, id, now);
      current = result.state;
      if (!result.changed) break;
    }
  }
  return { state: current, events };
}
