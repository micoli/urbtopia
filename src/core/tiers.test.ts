import { describe, expect, it } from 'vitest';
import { advance, dispatch, newGame, storageCapacity, utilityCapacity, type Command, type GameState } from './index';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;
const WORKSHOP_ID = 1;

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function failureKey(state: GameState, command: Command, now = T0): string | null {
  const result = dispatch(state, command, now);
  return result.ok ? null : result.error.key;
}

const initial = newGame({ seed: 'amber-fox-4821', now: T0 });
const rich: GameState = {
  ...initial,
  urbs: 1_000_000,
  storage: { materials: {}, goods: { planks: 10, bricks: 10, tiles: 10, tools: 10 } },
};
const withStorehouse = succeed(rich, { type: 'PlaceBuilding', buildingType: 'storehouse', x: 56, y: 59 });
const upgrade = (buildingId: number): Command => ({ type: 'UpgradeBuilding', buildingId });
const upgradeTimes = (state: GameState, buildingId: number, times: number) =>
  Array.from({ length: times }).reduce<GameState>((current) => succeed(current, upgrade(buildingId)), state);
const find = (state: GameState, id: number) => state.buildings.find((b) => b.id === id);

describe('Workshop Tiers', () => {
  it('reaches Tier 5 with Urbs and Goods, then stops', () => {
    const maxed = upgradeTimes(withStorehouse, WORKSHOP_ID, 4);
    expect(find(maxed, WORKSHOP_ID)?.tier).toBe(5);
    expect(maxed.storage.goods).toEqual({ planks: 7, bricks: 6, tiles: 6, tools: 6 });
    expect(failureKey(maxed, upgrade(WORKSHOP_ID))).toBe('error.maxTier');
  });

  it('refuses an upgrade without the Goods', () => {
    expect(failureKey({ ...withStorehouse, storage: { materials: {}, goods: {} } }, upgrade(WORKSHOP_ID))).toBe('error.missingGoods');
  });

  it('shortens new productions by 25% from Tier 2', () => {
    const tier2 = upgradeTimes(withStorehouse, WORKSHOP_ID, 1);
    const queued = succeed(tier2, { type: 'QueueProduction', buildingId: WORKSHOP_ID, item: 'wood' });
    expect(find(queued, WORKSHOP_ID)?.queue[0]?.duration).toBe(45_000);
  });

  it('raises the Slot ceiling from 5 to 8 at Tier 3', () => {
    let state: GameState = { ...upgradeTimes(withStorehouse, WORKSHOP_ID, 1) };
    for (let slots = 3; slots <= 5; slots++) state = succeed(state, { type: 'BuySlot', buildingId: WORKSHOP_ID });
    expect(failureKey(state, { type: 'BuySlot', buildingId: WORKSHOP_ID })).toBe('error.maxSlots');
    state = upgradeTimes(state, WORKSHOP_ID, 1);
    for (let slots = 6; slots <= 8; slots++) state = succeed(state, { type: 'BuySlot', buildingId: WORKSHOP_ID });
    expect(find(state, WORKSHOP_ID)?.slotCount).toBe(8);
    expect(failureKey(state, { type: 'BuySlot', buildingId: WORKSHOP_ID })).toBe('error.maxSlots');
  });

  it('doubles the quantity collected from Tier 4', () => {
    const tier4 = upgradeTimes(withStorehouse, WORKSHOP_ID, 3);
    const queued = succeed(tier4, { type: 'QueueProduction', buildingId: WORKSHOP_ID, item: 'wood' });
    const done = advance(queued, T0 + MINUTE).state;
    const collected = succeed(done, { type: 'Collect', buildingId: WORKSHOP_ID }, T0 + MINUTE);
    expect(collected.storage.materials.wood).toBe(2);
  });

  it('keeps an output waiting when its whole quantity does not fit', () => {
    const tier4 = upgradeTimes(withStorehouse, WORKSHOP_ID, 3);
    const queued = succeed(tier4, { type: 'QueueProduction', buildingId: WORKSHOP_ID, item: 'wood' });
    const nearlyFull: GameState = { ...advance(queued, T0 + MINUTE).state, storage: { ...queued.storage, materials: { stone: 19 } } };
    expect(failureKey(nearlyFull, { type: 'Collect', buildingId: WORKSHOP_ID }, T0 + MINUTE)).toBe('error.storageFull');
  });
});

describe('Utility Tiers', () => {
  const plantState = succeed(rich, { type: 'PlaceBuilding', buildingType: 'powerPlant', x: 50, y: 70 });
  const plantId = plantState.buildings.find((b) => b.type === 'powerPlant')?.id ?? 0;

  it('raises Capacity to 24 then 40', () => {
    const tier2 = succeed(plantState, upgrade(plantId));
    expect(utilityCapacity(tier2).power).toBe(24);
    expect(utilityCapacity(succeed(tier2, upgrade(plantId))).power).toBe(40);
  });

  it('stops at Tier 3', () => {
    expect(failureKey(upgradeTimes(plantState, plantId, 2), upgrade(plantId))).toBe('error.maxTier');
  });

  it('refuses to sell a plant when the remaining Capacity would not cover Demand', () => {
    const second = succeed(upgradeTimes(plantState, plantId, 1), { type: 'PlaceBuilding', buildingType: 'powerPlant', x: 52, y: 70 });
    const secondId = second.buildings.filter((b) => b.type === 'powerPlant')[1]?.id ?? 0;
    const water = succeed(second, { type: 'PlaceBuilding', buildingType: 'waterTower', x: 54, y: 70 });
    const withHome = succeed(water, { type: 'PlaceBuilding', buildingType: 'home', x: 56, y: 57 });
    const loaded: GameState = { ...withHome, buildings: withHome.buildings.map((b) => (b.type === 'home' ? { ...b, tier: 6 } : b)) };
    expect(failureKey(loaded, { type: 'SellBuilding', id: plantId })).toBe('error.utilityInUse');
    expect(failureKey(loaded, { type: 'SellBuilding', id: secondId })).toBeNull();
  });
});

describe('Silo and Vault', () => {
  const silo = succeed(withStorehouse, { type: 'PlaceBuilding', buildingType: 'silo', x: 58, y: 59 });
  const both = succeed(silo, { type: 'PlaceBuilding', buildingType: 'vault', x: 60, y: 59 });
  const idOf = (state: GameState, type: string) => state.buildings.find((b) => b.type === type)?.id ?? 0;

  it('adds Materials capacity only for the Silo and Goods capacity only for the Vault', () => {
    expect(storageCapacity(withStorehouse)).toEqual({ materials: 20, goods: 40 });
    expect(storageCapacity(silo)).toEqual({ materials: 60, goods: 40 });
    expect(storageCapacity(both)).toEqual({ materials: 60, goods: 120 });
  });

  it('raises each capacity with its own Tier', () => {
    const upgraded = succeed(succeed(both, upgrade(idOf(both, 'silo'))), upgrade(idOf(both, 'vault')));
    expect(storageCapacity(upgraded)).toEqual({ materials: 80, goods: 160 });
  });

  it('allows a single Silo and a single Vault', () => {
    expect(failureKey(both, { type: 'PlaceBuilding', buildingType: 'silo', x: 54, y: 59 })).toBe('error.siloExists');
    expect(failureKey(both, { type: 'PlaceBuilding', buildingType: 'vault', x: 52, y: 59 })).toBe('error.vaultExists');
  });

  it('stores Materials with a Silo alone', () => {
    const siloOnly = succeed(rich, { type: 'PlaceBuilding', buildingType: 'silo', x: 58, y: 59 });
    const queued = succeed(siloOnly, { type: 'QueueProduction', buildingId: WORKSHOP_ID, item: 'wood' });
    const collected = succeed(advance(queued, T0 + MINUTE).state, { type: 'Collect', buildingId: WORKSHOP_ID }, T0 + MINUTE);
    expect(collected.storage.materials.wood).toBe(1);
  });

  it('refuses to sell a storage when the stock would no longer fit', () => {
    const full: GameState = { ...both, storage: { materials: { wood: 50 }, goods: {} } };
    expect(failureKey(full, { type: 'SellBuilding', id: idOf(full, 'silo') })).toBe('error.storageInUse');
    expect(failureKey(full, { type: 'SellBuilding', id: idOf(full, 'vault') })).toBeNull();
  });
});
