import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, storageCapacity, type GameState } from '../index';

function productionCity(): GameState {
  const state = newGame({ seed: 'storage-production', now: 0 });
  return {
    ...state,
    buildings: [
      createBuilding(1, 'storehouse', 55, 55, 0),
      ...Array.from({ length: 2 }, (_, index) => ({ ...createBuilding(index + 2, 'workshop', 60 + index * 2, 55, 0), tier: 4, slotCount: 8 })),
      ...Array.from({ length: 3 }, (_, index) => ({ ...createBuilding(index + 4, 'factory', 60 + index * 2, 60, 0), tier: 4, slotCount: 8 })),
    ],
  };
}

describe('storage capacity follows production queues', () => {
  it('holds a full batch from every Workshop and Factory, including their Tier yield', () => {
    expect(storageCapacity(productionCity())).toEqual({ materials: 32, crops: 0, goods: 48 });
  });

  it('does not grant production-based storage without a Storehouse', () => {
    const state = productionCity();
    expect(storageCapacity({ ...state, buildings: state.buildings.filter(building => building.type !== 'storehouse') })).toEqual({ materials: 0, crops: 0, goods: 0 });
  });

  it('increases capacity when a production Slot is bought or the yield is upgraded', () => {
    const city = productionCity();
    const fewerSlots = {
      ...city, urbs: 100_000,
      buildings: city.buildings.map(building => building.id === 2 ? { ...building, slotCount: 7 } : building),
    };
    expect(storageCapacity(fewerSlots).materials).toBe(30);
    const bought = dispatch(fewerSlots, { type: 'BuySlot', buildingId: 2 }, 0);
    if (!bought.ok) throw new Error(bought.error.key);
    expect(storageCapacity(bought.state).materials).toBe(32);

    const lowerYield = {
      ...city, urbs: 100_000, storage: { materials: {}, goods: { tiles: 4 } },
      buildings: city.buildings.map(building => building.type === 'workshop' ? { ...building, tier: 3 } : building),
    };
    expect(storageCapacity(lowerYield).materials).toBe(20);
    const upgraded = dispatch(lowerYield, { type: 'UpgradeBuilding', buildingId: 2 }, 0);
    if (!upgraded.ok) throw new Error(upgraded.error.key);
    expect(storageCapacity(upgraded.state).materials).toBe(24);
  });

  it('retains higher upgraded capacity and adds specialized storage bonuses', () => {
    const state = productionCity();
    const upgraded = { ...state, buildings: state.buildings.map(building => building.id === 1 ? { ...building, tier: 6 } : building) };
    expect(storageCapacity(upgraded)).toEqual({ materials: 70, crops: 0, goods: 140 });
    expect(storageCapacity({ ...state, buildings: [...state.buildings, createBuilding(7, 'silo', 70, 55, 0), createBuilding(8, 'vault', 70, 60, 0)] })).toEqual({ materials: 72, crops: 0, goods: 128 });
  });

  it('collects all full queues without running out of storage', () => {
    let state = productionCity();
    state = {
      ...state,
      buildings: state.buildings.map(building => building.type === 'storehouse' ? building : {
        ...building,
        queue: Array.from({ length: building.slotCount }, () => ({
          item: building.type === 'workshop' ? 'wood' as const : 'planks' as const,
          duration: 60_000, startedAt: 0, done: true, quantity: 2,
        })),
      }),
    };
    for (const building of state.buildings.filter(building => building.type !== 'storehouse')) {
      const result = dispatch(state, { type: 'Collect', buildingId: building.id }, 0);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error(result.error.key);
      expect(result.events.some(event => event.type === 'StorageFull')).toBe(false);
      state = result.state;
    }
    expect(state.storage).toEqual({ materials: { wood: 32 }, goods: { planks: 48 } });
    expect(state.buildings.every(building => building.queue.length === 0)).toBe(true);
  });

  it('prevents selling a producer when the reduced capacity would strand existing stock', () => {
    const state = { ...productionCity(), storage: { materials: { wood: 32 }, goods: { planks: 48 } } };
    for (const id of [2, 4]) {
      const result = dispatch(state, { type: 'SellBuilding', id }, 0);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.key).toBe('error.storageInUse');
    }
    expect(dispatch(productionCity(), { type: 'SellBuilding', id: 2 }, 0).ok).toBe(true);
  });
});
