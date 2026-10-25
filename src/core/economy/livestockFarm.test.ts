import { describe, expect, it } from 'vitest';
import { advance, dispatch, newGame, type Command, type GameState } from '../index';
import { createBuilding } from '../buildings/buildingSpecs';
import { buildLimitReached, copyThresholds } from '../buildings/buildLimit';
import { compartmentOf } from './storage';
import { producibleItems } from './items';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;
const CITIZENS_FOR_ALL_SPECIES = 700;

const failureKey = (state: GameState, command: Command): string | null => {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
};

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

const homes = Array.from({ length: CITIZENS_FOR_ALL_SPECIES / 4 }, (_, index) => ({ ...createBuilding(100 + index, 'home', 20 + (index % 30), 20 + Math.floor(index / 30), 0), tier: 4 }));
const farm = createBuilding(900, 'livestockFarm', 56, 57, 0);
const base = newGame({ seed: 'livestock-farm', now: T0 });
const city = (materials: Record<string, number>): GameState => ({
  ...base,
  buildings: [...base.buildings, ...homes, farm, createBuilding(901, 'storehouse', 50, 50, 0)],
  storage: { materials, goods: {} },
});
const farmOf = (state: GameState) => state.buildings.find((building) => building.id === farm.id)!;

describe('Livestock farm', () => {
  it('produces only Animal Materials', () => {
    expect(producibleItems('livestockFarm')).toEqual(['henEgg', 'duckEgg', 'milk', 'wool', 'goatMilk', 'alpacaWool', 'silk']);
  });

  it('opens with 2 Slots and a Build limit of 3 copies', () => {
    expect(farm.slotCount).toBe(2);
    expect(copyThresholds('livestockFarm')).toEqual([80, 300, 800]);
    expect(buildLimitReached(city({}), 'livestockFarm')).toBe(false);
  });

  it.each([
    ['henEgg', 'corn'],
    ['duckEgg', 'corn'],
    ['milk', 'wheat'],
    ['wool', 'wheat'],
    ['goatMilk', 'wheat'],
    ['alpacaWool', 'wheat'],
    ['silk', 'mulberryLeaf'],
  ])('%s eats %s from the stock', (item, feed) => {
    const state = succeed(city({ [feed]: 3 }), { type: 'QueueProduction', buildingId: farm.id, item });
    expect(state.storage.materials[feed as 'corn']).toBe(2);
    expect(farmOf(state).queue).toHaveLength(1);
  });

  it('waits for Feed: nothing is queued without it', () => {
    expect(failureKey(city({}), { type: 'QueueProduction', buildingId: farm.id, item: 'henEgg' })).toBe('error.missingMaterials');
    expect(failureKey(city({ wheat: 5 }), { type: 'QueueProduction', buildingId: farm.id, item: 'henEgg' })).toBe('error.missingMaterials');
  });

  it('refuses a species the city has not unlocked', () => {
    const small: GameState = { ...city({ wheat: 5 }), buildings: [base.buildings[0]!, farm, createBuilding(901, 'storehouse', 50, 50, 0)].filter((b) => b !== undefined) };
    expect(failureKey(small, { type: 'QueueProduction', buildingId: farm.id, item: 'alpacaWool' })).toBe('error.itemLocked');
  });

  it('refuses a Good', () => {
    expect(failureKey(city({ milk: 5 }), { type: 'QueueProduction', buildingId: farm.id, item: 'cream' })).toBe('error.cannotProduce');
  });

  it('delivers the Material to the Storehouse once the cycle is done', () => {
    const queued = succeed(city({ corn: 1 }), { type: 'QueueProduction', buildingId: farm.id, item: 'henEgg' });
    const done = advance(queued, T0 + 9 * MINUTE).state;
    const collected = succeed(done, { type: 'Collect', buildingId: farm.id }, T0 + 9 * MINUTE);
    expect(collected.storage.materials.henEgg).toBe(1);
  });

  it('keeps Animal Materials out of the crops compartment, but not mulberry leaves', () => {
    expect(compartmentOf('henEgg')).toBe('materials');
    expect(compartmentOf('wool')).toBe('materials');
    expect(compartmentOf('mulberryLeaf')).toBe('crops');
    expect(compartmentOf('corn')).toBe('crops');
  });
});
