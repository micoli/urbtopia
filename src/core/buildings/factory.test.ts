import { describe, expect, it } from 'vitest';
import { advance, dispatch, newGame, storageCapacity, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function failureKey(state: GameState, command: Command, now = T0): string | null {
  const result = dispatch(state, command, now);
  return result.ok ? null : result.error.key;
}

const WORKSHOP_ID = 1;
const FACTORY_ID = 2;
const initial = newGame({ seed: 'amber-fox-4821', now: T0 });
const withStorehouse = succeed(initial, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 });
const stocked: GameState = { ...withStorehouse, urbs: 100_000, storage: { materials: { wood: 5, stone: 5 }, goods: {} } };
const factoryQueue = (state: GameState) => state.buildings.find((b) => b.id === FACTORY_ID)?.queue ?? [];

describe('Factory production', () => {
  it('turns 2 Wood into Planks in 2 minutes, taking the Materials at once', () => {
    const state = succeed(stocked, { type: 'QueueProduction', buildingId: FACTORY_ID, item: 'planks' });
    expect(state.storage.materials).toEqual({ wood: 3, stone: 5 });
    expect(factoryQueue(state)).toEqual([{ item: 'planks', duration: 2 * MINUTE, startedAt: T0, done: false, quantity: 1 }]);
  });

  it('turns 2 Stone and 1 Wood into Bricks in 4 minutes', () => {
    const state = succeed(stocked, { type: 'QueueProduction', buildingId: FACTORY_ID, item: 'bricks' });
    expect(state.storage.materials).toEqual({ wood: 4, stone: 3 });
    expect(factoryQueue(state)[0]?.duration).toBe(4 * MINUTE);
  });

  it('refuses when Materials are missing and takes nothing', () => {
    const poor: GameState = { ...stocked, storage: { materials: { wood: 1 }, goods: {} } };
    expect(failureKey(poor, { type: 'QueueProduction', buildingId: FACTORY_ID, item: 'planks' })).toBe('error.missingMaterials');
  });

  it('keeps Goods out of Workshops and Materials out of Factories', () => {
    expect(failureKey(stocked, { type: 'QueueProduction', buildingId: WORKSHOP_ID, item: 'planks' })).toBe('error.cannotProduce');
    expect(failureKey(stocked, { type: 'QueueProduction', buildingId: FACTORY_ID, item: 'wood' })).toBe('error.cannotProduce');
  });

  it('delivers finished Goods to the Goods compartment when collected', () => {
    const queued = succeed(stocked, { type: 'QueueProduction', buildingId: FACTORY_ID, item: 'planks' });
    const ready = advance(queued, T0 + 2 * MINUTE).state;
    const collected = succeed(ready, { type: 'Collect', buildingId: FACTORY_ID }, T0 + 2 * MINUTE);
    expect(collected.storage.goods).toEqual({ planks: 1 });
    expect(collected.storage.materials).toEqual({ wood: 3, stone: 5 });
  });

  it('refuses to collect Goods when the Goods compartment is full, even if Materials have room', () => {
    const queued = succeed(stocked, { type: 'QueueProduction', buildingId: FACTORY_ID, item: 'planks' });
    const ready = advance(queued, T0 + 2 * MINUTE).state;
    const full: GameState = { ...ready, storage: { ...ready.storage, goods: { bricks: 40 } } };
    expect(failureKey(full, { type: 'Collect', buildingId: FACTORY_ID }, T0 + 2 * MINUTE)).toBe('error.storageFull');
  });
});

describe('BuySlot', () => {
  const buy: Command = { type: 'BuySlot', buildingId: WORKSHOP_ID };

  it('charges 500, 1,500 then 4,000 Urbs for the 3rd, 4th and 5th Slot', () => {
    let state: GameState = { ...initial, urbs: 10_000 };
    const prices = [];
    for (let slot = 3; slot <= 5; slot++) {
      const before = state.urbs;
      state = succeed(state, buy);
      prices.push(before - state.urbs);
      expect(state.buildings.find((b) => b.id === WORKSHOP_ID)?.slotCount).toBe(slot);
    }
    expect(prices).toEqual([500, 1500, 4000]);
  });

  it('stops at 5 Slots', () => {
    const maxed: GameState = { ...initial, urbs: 10_000, buildings: initial.buildings.map((b) => (b.id === WORKSHOP_ID ? { ...b, slotCount: 5 } : b)) };
    expect(failureKey(maxed, buy)).toBe('error.maxSlots');
  });

  it('refuses when Urbs are missing or the building has no production queue', () => {
    expect(failureKey({ ...initial, urbs: 100 }, buy)).toBe('error.notEnoughUrbs');
    const rich: GameState = { ...initial, urbs: 10_000 };
    expect(failureKey(rich, { type: 'BuySlot', buildingId: 999 })).toBe('error.unknownBuilding');
    const withHome = succeed(rich, { type: 'PlaceBuilding', buildingType: 'powerPlant', x: 70, y: 70 });
    const plant = withHome.buildings.find((b) => b.type === 'powerPlant');
    expect(failureKey(withHome, { type: 'BuySlot', buildingId: plant?.id ?? 0 })).toBe('error.cannotProduce');
  });

  it('is not refunded when the building is sold', () => {
    const bought = succeed({ ...initial, urbs: 1000 }, buy);
    const sold = succeed(bought, { type: 'SellBuilding', id: WORKSHOP_ID });
    expect(sold.urbs).toBe(1000 - 500 + 75);
  });
});

describe('UpgradeBuilding on the Storehouse', () => {
  const storehouseId = withStorehouse.buildings.find((b) => b.type === 'storehouse')?.id ?? 0;
  const upgrade: Command = { type: 'UpgradeBuilding', buildingId: storehouseId };

  it('adds 10 Materials and 20 Goods of capacity per Tier, for 300, 800, 2,000, 5,000 and 12,000 Urbs', () => {
    let state: GameState = { ...withStorehouse, urbs: 100_000 };
    const prices = [];
    for (let level = 1; level <= 5; level++) {
      const before = state.urbs;
      state = succeed(state, upgrade);
      prices.push(before - state.urbs);
      expect(storageCapacity(state)).toEqual({ materials: 20 + 10 * level, crops: 0, goods: 40 + 20 * level });
    }
    expect(prices).toEqual([300, 800, 2000, 5000, 12000]);
    expect(storageCapacity(state)).toEqual({ materials: 70, crops: 0, goods: 140 });
  });

  it('stops at Tier 6', () => {
    const maxed: GameState = {
      ...withStorehouse,
      urbs: 100_000,
      buildings: withStorehouse.buildings.map((b) => (b.id === storehouseId ? { ...b, tier: 6 } : b)),
    };
    expect(failureKey(maxed, upgrade)).toBe('error.maxTier');
  });

  it('needs enough Urbs', () => {
    expect(failureKey({ ...withStorehouse, urbs: 10 }, upgrade)).toBe('error.notEnoughUrbs');
  });

  it('loses its upgrades when the empty Storehouse is sold and rebuilt', () => {
    const upgraded = succeed({ ...withStorehouse, urbs: 5000 }, upgrade);
    const sold = succeed(upgraded, { type: 'SellBuilding', id: storehouseId });
    const rebuilt = succeed(sold, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 });
    expect(storageCapacity(rebuilt)).toEqual({ materials: 20, crops: 0, goods: 40 });
  });
});

describe('RushProduction', () => {
  const rush: Command = { type: 'RushProduction', buildingId: FACTORY_ID };
  const queuedBricks = succeed(stocked, { type: 'QueueProduction', buildingId: FACTORY_ID, item: 'bricks' });

  it('charges twice the value of the item when all the time is left', () => {
    const rushed = succeed(queuedBricks, rush);
    expect(queuedBricks.urbs - rushed.urbs).toBe(68);
  });

  it('charges less as time runs out, but never less than 1 Urb', () => {
    const halfway = succeed(queuedBricks, rush, T0 + 2 * MINUTE);
    expect(queuedBricks.urbs - halfway.urbs).toBe(34);
    const almost = succeed(queuedBricks, rush, T0 + 4 * MINUTE - 1);
    expect(queuedBricks.urbs - almost.urbs).toBe(1);
  });

  it('completes the production like a natural end, ready to collect', () => {
    const rushed = succeed(queuedBricks, rush, T0 + MINUTE);
    expect(factoryQueue(rushed)[0]?.done).toBe(true);
    const collected = succeed(rushed, { type: 'Collect', buildingId: FACTORY_ID }, T0 + MINUTE);
    expect(collected.storage.goods).toEqual({ bricks: 1 });
  });

  it('starts the next waiting production at once', () => {
    const twice = succeed(queuedBricks, { type: 'QueueProduction', buildingId: FACTORY_ID, item: 'planks' });
    const rushed = succeed(twice, rush, T0 + MINUTE);
    expect(factoryQueue(rushed)[1]).toMatchObject({ item: 'planks', startedAt: T0 + MINUTE, done: false });
  });

  it('refuses when nothing is running, when Urbs are missing or for an unknown building', () => {
    expect(failureKey(stocked, rush)).toBe('error.nothingToRush');
    expect(failureKey({ ...queuedBricks, urbs: 10 }, rush)).toBe('error.notEnoughUrbs');
    expect(failureKey(queuedBricks, { type: 'RushProduction', buildingId: 999 })).toBe('error.unknownBuilding');
  });
});
