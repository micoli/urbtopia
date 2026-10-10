import { describe, expect, it } from 'vitest';
import { CROPS, CROP_IDS, GOODS, PRODUCTION_UPGRADE_COSTS, advance, createBuilding, dispatch, isGood, newGame, producibleItems, storageCapacity, upgradeCostOf, type Command, type GameState } from '../index';

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

const base = newGame({ seed: 'packhouse', now: T0 });
const home = { ...createBuilding(base.nextId, 'home', 40, 40, 0), tier: 3 };
const city: GameState = { ...base, urbs: 10_000, nextId: base.nextId + 1, buildings: [...base.buildings, home] };
const placePackhouse: Command = { type: 'PlaceBuilding', buildingType: 'packhouse', x: 56, y: 59 };
const withStorehouse = succeed(city, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 });
const packed = succeed({ ...withStorehouse, storage: { materials: { wheat: 6 }, goods: {} } }, { type: 'PlaceBuilding', buildingType: 'packhouse', x: 60, y: 59 });
const packhouse = packed.buildings.find(b => b.type === 'packhouse')!;

describe('Packhouse building', () => {
  it('is locked below 20 Citizens', () => {
    expect(failureKey(base, placePackhouse)).toBe('error.itemLocked');
  });

  it('costs 250 Urbs and is limited to one per city', () => {
    const built = succeed(city, placePackhouse);
    expect(built.urbs).toBe(city.urbs - 250);
    expect(failureKey(built, { ...placePackhouse, x: 60 })).toBe('error.packhouseExists');
  });

  it('reuses the production upgrade costs and starts with two Slots', () => {
    for (const tier of [2, 3, 4, 5]) expect(upgradeCostOf('packhouse', tier)).toEqual(PRODUCTION_UPGRADE_COSTS[tier]);
    expect(packhouse.slotCount).toBe(2);
  });
});

describe('Packed Goods', () => {
  it('has a crate, a box and a pallet per species packing 2, 5 and 10 Crop Materials', () => {
    for (const id of CROP_IDS) {
      expect(GOODS[`${id}Crate`]).toEqual({ category: 'food', recipe: { [id]: 2 }, durationMs: CROPS[id].packingMs, value: CROPS[id].packedValue, unlockCitizens: CROPS[id].unlockCitizens, minTier: 1 });
      expect(GOODS[`${id}Box`]).toEqual({ category: 'food', recipe: { [id]: 5 }, durationMs: CROPS[id].packingMs * 2.5, value: Math.round(CROPS[id].packedValue * 2.5 * 1.1), unlockCitizens: CROPS[id].unlockCitizens, minTier: 1 });
      expect(GOODS[`${id}Pallet`]).toEqual({ category: 'food', recipe: { [id]: 10 }, durationMs: CROPS[id].packingMs * 5, value: Math.round(CROPS[id].packedValue * 5 * 1.25), unlockCitizens: CROPS[id].unlockCitizens, minTier: 1 });
    }
    expect(GOODS.wheatBox).toMatchObject({ durationMs: 2.5 * MINUTE, value: 55 });
    expect(GOODS.wheatPallet).toMatchObject({ durationMs: 5 * MINUTE, value: 125 });
    expect(GOODS.wheatCrate).toMatchObject({ durationMs: MINUTE, value: 20 });
    expect(GOODS.palmtreeCrate).toMatchObject({ durationMs: 6 * MINUTE, value: 215 });
  });

  it('is produced by the Packhouse only', () => {
    expect(producibleItems('packhouse')).toEqual(CROP_IDS.flatMap(id => [`${id}Crate`, `${id}Box`, `${id}Pallet`]));
    expect(producibleItems('factory').every(item => !/(Crate|Box|Pallet)$/.test(String(item)))).toBe(true);
    expect(producibleItems('factory')).toContain('planks');
    expect(failureKey(packed, { type: 'QueueProduction', buildingId: 2, item: 'wheatCrate' })).toBe('error.cannotProduce');
    expect(failureKey(packed, { type: 'QueueProduction', buildingId: packhouse.id, item: 'planks' })).toBe('error.cannotProduce');
  });

  it('packs 10 Crop Material into 1 pallet, taking the Materials at once', () => {
    const stocked = { ...packed, storage: { materials: { wheat: 12 }, goods: {} } };
    const queued = succeed(stocked, { type: 'QueueProduction', buildingId: packhouse.id, item: 'wheatPallet' });
    expect(queued.storage.materials).toEqual({ wheat: 2 });
  });

  it('packs 2 Crop Material into 1 crate, taking the Materials at once', () => {
    const queued = succeed(packed, { type: 'QueueProduction', buildingId: packhouse.id, item: 'wheatCrate' });
    expect(queued.storage.materials).toEqual({ wheat: 4 });
    const ready = advance(queued, T0 + MINUTE).state;
    const collected = succeed(ready, { type: 'Collect', buildingId: packhouse.id }, T0 + MINUTE);
    expect(collected.storage.goods).toEqual({ wheatCrate: 1 });
  });

  it('refuses without enough Crop Material', () => {
    const poor = { ...packed, storage: { materials: { wheat: 1 }, goods: {} } };
    expect(failureKey(poor, { type: 'QueueProduction', buildingId: packhouse.id, item: 'wheatCrate' })).toBe('error.missingMaterials');
  });

  it('is sold to the Market like any Good', () => {
    const stocked = { ...packed, marketUnlocked: true, storage: { materials: {}, goods: { wheatCrate: 3 } } };
    const sold = succeed(stocked, { type: 'SellToMarket', good: 'wheatCrate', quantity: 2 });
    expect(sold.storage.goods).toEqual({ wheatCrate: 1 });
    expect(sold.urbs).toBeGreaterThan(stocked.urbs);
    expect(isGood('wheatCrate')).toBe(true);
  });

  it('makes the Storehouse hold a full batch of crates on top of Factory output', () => {
    const factories = [10, 11, 12].map(id => ({ ...createBuilding(id, 'factory', 30 + id, 30, 0), tier: 4, slotCount: 8 }));
    const busy = { ...packed, buildings: [...packed.buildings.map(b => b.id === packhouse.id ? { ...b, tier: 4, slotCount: 8 } : b), ...factories] };
    expect(storageCapacity(busy).goods).toBe(2 + 3 * 16 + 16);
  });
});
