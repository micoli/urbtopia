import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type GameState } from '../core';
import { readOnlyStore } from './readOnlyStore';

vi.stubGlobal('window', { location: { search: '' } });
const { createGameStore } = await import('./gameStore');
const NOW = 1_700_000_000_000;

function initial(): GameState {
  return { ...newGame({ now: NOW, seed: 'undo' }), buildings: [], roads: [], roundabouts: [] };
}

afterEach(() => {
  vi.restoreAllMocks();
  readOnlyStore.getState().set(false);
});

describe('deletion undo', () => {
  it.each(['shop', 'storehouse', 'silo', 'vault', 'home', 'factory', 'powerPlant', 'waterTower'] as const)('restores a %s with its Tier and Slots', (type) => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const building = { ...createBuilding(10, type, 65, 65, 0), tier: 2, slotCount: 3 };
    const state = { ...initial(), buildings: [building] };
    const store = createGameStore(state);
    store.getState().send({ type: 'SellBuilding', id: 10 });
    expect(store.getState().state.buildings).toEqual([]);
    store.getState().undo();
    expect(store.getState().state).toEqual(state);
  });

  it('preserves Shop stock and earnings and resumes its sales timer', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const shop = createBuilding(10, 'shop', 65, 65, 0);
    shop.stacks = [{ good: 'planks', stock: 5, earned: 12, nextSaleAt: NOW + 1000 }];
    const store = createGameStore({ ...initial(), buildings: [shop] });
    store.getState().send({ type: 'SellBuilding', id: 10 });
    vi.spyOn(Date, 'now').mockReturnValue(NOW + 2000);
    store.getState().undo();
    expect(store.getState().state.buildings[0]?.stacks).toEqual([{ ...shop.stacks[0], nextSaleAt: NOW + 3000 }]);
  });

  it('restores a sold building and its contents without rewinding other production or Urbs', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const sold = createBuilding(10, 'workshop', 65, 65, 0);
    sold.queue = [{ item: 'wood', duration: 1000, startedAt: NOW, done: false, quantity: 1 }];
    const other = { ...sold, id: 11, x: 70 };
    const state = { ...initial(), buildings: [sold, other] };
    const store = createGameStore(state);
    store.getState().send({ type: 'SellBuilding', id: 10 });
    expect(store.getState().state.urbs).toBeGreaterThan(state.urbs);
    store.getState().tick(NOW + 2000);
    vi.spyOn(Date, 'now').mockReturnValue(NOW + 2000);
    store.getState().undo();
    const restored = store.getState().state;
    expect(restored.urbs).toBe(state.urbs);
    expect(restored.lastSeen).toBe(NOW + 2000);
    expect(restored.buildings.find((building) => building.id === 11)?.queue[0]?.done).toBe(true);
    expect(restored.buildings.find((building) => building.id === 10)?.queue[0]).toEqual({ ...sold.queue[0], startedAt: NOW + 2000 });
    expect(store.getState().deletionUndo).toBeNull();
    store.getState().undo();
    expect(store.getState().state).toBe(restored);
  });

  it('restores crossings and a complete roundabout removed by a path', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const state: GameState = { ...initial(), roads: [{ x: 65, y: 65, kind: 'crossing' }, { x: 66, y: 65, kind: 'road' }], roundabouts: [{ x: 70, y: 65 }] };
    const store = createGameStore(state);
    store.getState().send({ type: 'DemolishRoadPath', from: { x: 65, y: 65 }, to: { x: 70, y: 65 } });
    expect(store.getState().state.roads).toEqual([]);
    expect(store.getState().state.roundabouts).toEqual([]);
    store.getState().undo();
    expect(store.getState().state).toEqual(state);
  });

  it('keeps only the latest deletion and invalidates it after another successful command or replacement', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const state = { ...initial(), buildings: [createBuilding(10, 'workshop', 65, 65, 0), createBuilding(11, 'shop', 70, 65, 0)] };
    const store = createGameStore(state);
    store.getState().send({ type: 'SellBuilding', id: 10 });
    store.getState().send({ type: 'SellBuilding', id: 11 });
    store.getState().undo();
    expect(store.getState().state.buildings.map((building) => building.id)).toEqual([11]);
    store.getState().send({ type: 'SellBuilding', id: 11 });
    store.getState().send({ type: 'SkipTime', hours: 1 });
    expect(store.getState().deletionUndo).toBeNull();
    store.getState().replaceState(state);
    store.getState().send({ type: 'SellBuilding', id: 10 });
    store.getState().replaceState(store.getState().state);
    expect(store.getState().deletionUndo).toBeNull();
  });

  it('preserves undo on a rejected action and prevents undo in a read-only tab', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const state = { ...initial(), buildings: [createBuilding(10, 'shop', 65, 65, 0)] };
    const store = createGameStore(state);
    store.getState().send({ type: 'SellBuilding', id: 10 });
    const undo = store.getState().deletionUndo;
    store.getState().send({ type: 'SellBuilding', id: 999 });
    expect(store.getState().deletionUndo).toBe(undo);
    readOnlyStore.getState().set(true);
    store.getState().undo();
    expect(store.getState().state.buildings).toEqual([]);
    readOnlyStore.getState().set(false);
    store.getState().undo();
    expect(store.getState().state.buildings).toEqual(state.buildings);
  });
});
