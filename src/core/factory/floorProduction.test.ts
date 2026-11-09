import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, productionTierOf, type Building, type FixtureId, type Rotation, type VenueFixture } from '../index';
import { durationOf, MATERIAL_ENTRIES } from '../economy/items';
import { newQueueEntry, productionDurationOf } from '../economy/production';

let nextId = 1;
const put = (type: FixtureId, x: number, y: number, rotation: Rotation = 0): VenueFixture => ({ id: nextId++, type, x, y, rotation });
const factory = (tier: number, fixtures: VenueFixture[] = []): Building => ({
  ...createBuilding(1, 'factory', 55, 50, 0),
  tier,
  ...(fixtures.length > 0 ? { floor: { fixtures, nextFixtureId: nextId } } : {}),
});
const ITEM = 'planks';
const pressLine = () => [put('factoryMotor', 2, 2), put('factoryShaft', 2, 3), put('factoryPress', 2, 4, 2)];
const vatLine = () => [put('factoryPump', 2, 2), put('factoryPipe', 2, 3), put('factoryMixingVat', 2, 4, 2)];

describe('a Factory with a floor', () => {
  it('produces as before with no floor, an empty floor or no linked Machine', () => {
    const base = Math.round(durationOf(ITEM) * productionTierOf(factory(5)).durationFactor);
    expect(productionDurationOf(factory(5), ITEM)).toBe(base);
    expect(productionDurationOf({ ...factory(5), floor: { fixtures: [], nextFixtureId: 1 } }, ITEM)).toBe(base);
    expect(productionDurationOf(factory(5, [put('factoryPress', 2, 4, 2)]), ITEM)).toBe(base);
    expect(newQueueEntry(factory(5), ITEM, 0).entry.quantity).toBe(productionTierOf(factory(5)).yield);
  });

  it('works faster with a linked Machine, up to the cap of its Tier', () => {
    const tier = factory(5, pressLine());
    const base = durationOf(ITEM) * productionTierOf(tier).durationFactor;
    expect(productionDurationOf(tier, ITEM)).toBe(Math.round(base / 1.2));
    const low = factory(1, pressLine());
    expect(productionDurationOf(low, ITEM)).toBe(Math.round(durationOf(ITEM) * productionTierOf(low).durationFactor / 1.1));
  });

  it('adds a fraction of the yield to every cycle, whole units at a time, with the rest carried over', () => {
    let building = factory(4, vatLine());
    const quantities: number[] = [];
    for (let cycle = 0; cycle < 5; cycle++) {
      const queued = newQueueEntry(building, ITEM, 0);
      quantities.push(queued.entry.quantity);
      building = queued.building;
    }
    const base = productionTierOf(building).yield;
    expect(quantities.every(quantity => Number.isInteger(quantity))).toBe(true);
    expect(quantities.reduce((total, quantity) => total + quantity, 0)).toBe(base * 5 + 1);
  });

  it('shapes the production a player queues', () => {
    const building = factory(5, vatLine());
    const materials = Object.fromEntries(MATERIAL_ENTRIES.map(({ id }) => [id, 1000]));
    const state = { ...newGame({ seed: 'floor-production', now: 0 }), tutorial: null, urbs: 1_000_000, storage: { materials, goods: {} }, buildings: [building] } as never;
    const result = dispatch(state, { type: 'QueueProduction', buildingId: 1, item: ITEM }, 0);
    if (!result.ok) throw new Error(result.error.key);
    const queued = result.state.buildings[0]!;
    expect(queued.queue[0]).toMatchObject({ duration: productionDurationOf(building, ITEM) });
    expect(queued.floor?.carry).toBeGreaterThan(0);
  });

  it('leaves the Factory untouched when no yield is added', () => {
    const building = factory(5, pressLine());
    expect(newQueueEntry(building, ITEM, 0).building).toBe(building);
  });
});
