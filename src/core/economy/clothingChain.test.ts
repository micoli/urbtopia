import { describe, expect, it } from 'vitest';
import { advance, dispatch, newGame, type Command, type GameState } from '../index';
import { createBuilding } from '../buildings/buildingSpecs';
import { canSell, sellableGoodsOf } from './shops';
import { producibleItems } from './items';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;
const CITIZENS = 700;

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

const failureKey = (state: GameState, command: Command): string | null => {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
};

const homes = Array.from({ length: CITIZENS / 4 }, (_, index) => ({ ...createBuilding(100 + index, 'home', 44 + index, 60, 0), tier: 4 }));
const dairy = createBuilding(900, 'dairy', 56, 57, 0);
const textileMill = createBuilding(901, 'textileMill', 58, 57, 0);
const knitwear = createBuilding(902, 'knitwearFactory', 60, 57, 0);
const base = newGame({ seed: 'clothing-chain', now: T0 });
const city = (materials: Record<string, number>): GameState => ({
  ...base,
  buildings: [...base.buildings, ...homes, dairy, textileMill, knitwear, createBuilding(903, 'storehouse', 50, 50, 0)],
  storage: { materials, goods: {} },
});

function produce(state: GameState, buildingId: number, item: string): GameState {
  const queued = succeed(state, { type: 'QueueProduction', buildingId, item }, state.lastSeen);
  const minutes = queued.buildings.find((building) => building.id === buildingId)!.queue[0]!.duration / MINUTE;
  const finished = state.lastSeen + 3 * minutes * MINUTE;
  return succeed(advance(queued, finished).state, { type: 'Collect', buildingId }, finished);
}

describe('Dairy, Textile mill and Knitwear factory', () => {
  it('list what they make', () => {
    expect(producibleItems('dairy')).toEqual(['cream', 'cheese', 'goatCheese']);
    expect(producibleItems('textileMill')).toEqual(['textile', 'alpacaTextile', 'silkFabric']);
    expect(producibleItems('knitwearFactory')).toEqual(['sweater', 'gloves', 'hat', 'alpacaSweater', 'scarf']);
  });

  it('make a Sweater from Wool through Textile', () => {
    const textile = produce(city({ wool: 1 }), textileMill.id, 'textile');
    expect(textile.storage.materials).toMatchObject({ textile: 1, wool: 0 });
    const sweater = produce({ ...textile, storage: { ...textile.storage, materials: { ...textile.storage.materials, textile: 2 } } }, knitwear.id, 'sweater');
    expect(sweater.storage.goods.sweater).toBe(1);
  });

  it('keep each fabric apart: a Scarf needs Silk fabric, not Textile', () => {
    expect(failureKey(city({ textile: 5 }), { type: 'QueueProduction', buildingId: knitwear.id, item: 'scarf' })).toBe('error.missingMaterials');
    expect(failureKey(city({ alpacaTextile: 1 }), { type: 'QueueProduction', buildingId: knitwear.id, item: 'alpacaSweater' })).toBe('error.missingMaterials');
  });

  it('refuse another building\'s items', () => {
    expect(failureKey(city({ milk: 5 }), { type: 'QueueProduction', buildingId: knitwear.id, item: 'cream' })).toBe('error.cannotProduce');
    expect(failureKey(city({ wool: 5 }), { type: 'QueueProduction', buildingId: dairy.id, item: 'textile' })).toBe('error.cannotProduce');
  });

  it('turn Milk into Cream, and two Milks into Cheese', () => {
    expect(produce(city({ milk: 1 }), dairy.id, 'cream').storage.goods.cream).toBe(1);
    expect(failureKey(city({ milk: 1 }), { type: 'QueueProduction', buildingId: dairy.id, item: 'cheese' })).toBe('error.missingMaterials');
    expect(produce(city({ milk: 2 }), dairy.id, 'cheese').storage.goods.cheese).toBe(1);
  });

  it('give the Dairy and the Knitwear factory a Counter of their own Goods, and the Textile mill none', () => {
    expect(dairy.stacks).toHaveLength(3);
    expect(knitwear.stacks).toHaveLength(3);
    expect(textileMill.stacks).toHaveLength(0);
    expect(sellableGoodsOf(dairy)).toEqual(['cream', 'cheese', 'goatCheese']);
    expect(canSell(dairy, 'sweater')).toBe(false);
    expect(canSell(knitwear, 'scarf')).toBe(true);
    expect(canSell(knitwear, 'bread')).toBe(false);
  });
});
