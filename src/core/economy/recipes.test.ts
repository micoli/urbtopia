import { describe, expect, it } from 'vitest';
import { GOODS, dispatch, isMaterial, newGame, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;

const homes = Array.from({ length: 34 }, (_, index) => ({
  id: 100 + index,
  type: 'home' as const,
  x: 20 + index,
  y: 20,
  rotation: 0 as const,
  slotCount: 0,
  queue: [],
  stacks: [],
  tier: 1,
  taxCitizenMs: 0,
}));

const base = newGame({ seed: 'amber-fox-4821', now: T0 });
const city: GameState = {
  ...base,
  buildings: [...base.buildings, ...homes],
  storage: { materials: { wood: 10, stone: 10, clay: 10, metal: 10, silicon: 10 }, goods: {} },
};

const TIER_5_FACTOR = 0.75;
const topTierCity: GameState = { ...city, buildings: city.buildings.map((b) => (b.id === 1 || b.id === 2 ? { ...b, tier: 5 } : b)) };

function queue(buildingId: number, item: string, from: GameState = city): GameState {
  const command: Command = { type: 'QueueProduction', buildingId, item };
  const result = dispatch(from, command, T0);
  if (!result.ok) throw new Error(`${item}: ${result.error.key}`);
  return result.state;
}

const entryOf = (state: GameState, buildingId: number) => state.buildings.find((b) => b.id === buildingId)?.queue[0];

describe('Materials of the full economy', () => {
  it.each([
    ['clay', 4],
    ['metal', 8],
  ])('%s takes %d minutes in a Workshop', (item, minutes) => {
    expect(entryOf(queue(1, item), 1)?.duration).toBe(minutes * MINUTE);
  });

  it('silicon takes 16 minutes, 12 at Tier 5, and needs Tier 5', () => {
    expect(entryOf(queue(1, 'silicon', topTierCity), 1)?.duration).toBe(16 * MINUTE * TIER_5_FACTOR);
    expect(() => queue(1, 'silicon')).toThrow('error.tierTooLow');
  });
});

describe('Goods of the full economy', () => {
  it.each([
    ['tiles', 6, { clay: 8 }],
    ['tools', 8, { metal: 9, wood: 9 }],
  ])('%s takes %d minutes and uses its recipe', (item, minutes, remaining) => {
    const state = queue(2, item);
    expect(entryOf(state, 2)?.duration).toBe(minutes * MINUTE);
    expect(state.storage.materials).toMatchObject(remaining);
  });
});

describe('Goods that need a Tier 5 Factory', () => {
  it.each([
    ['glass', 12, { clay: 8, silicon: 9 }],
    ['circuits', 16, { metal: 9, silicon: 9 }],
  ])('%s takes %d minutes, shortened at Tier 5, and is refused below it', (item, minutes, remaining) => {
    const state = queue(2, item, topTierCity);
    expect(entryOf(state, 2)?.duration).toBe(minutes * MINUTE * TIER_5_FACTOR);
    expect(state.storage.materials).toMatchObject(remaining);
    expect(() => queue(2, item)).toThrow('error.tierTooLow');
  });
});

describe('Late-game Materials and Goods', () => {
  const rich: GameState = {
    ...topTierCity,
    storage: { materials: { stone: 10, clay: 10, metal: 10, sand: 10, coal: 10, gold: 10 }, goods: {} },
  };
  const citizens = (count: number): GameState => ({
    ...rich,
    buildings: [...rich.buildings, ...Array.from({ length: count }, (_, index) => ({ ...homes[0]!, id: 500 + index, tier: 6 }))],
  });

  it.each([
    ['sand', 24, 0, 1],
    ['coal', 32, 2, 3],
    ['gold', 48, 4, 5],
  ])('%s takes %d minutes (0.75 at Tier 5) and unlocks with enough Citizens', (item, minutes, lockedHomes, unlockedHomes) => {
    expect(() => queue(1, item, citizens(lockedHomes))).toThrow('error.itemLocked');
    expect(entryOf(queue(1, item, citizens(unlockedHomes)), 1)?.duration).toBe(minutes * MINUTE * TIER_5_FACTOR);
  });

  it.each([
    ['steel', { coal: 9, metal: 9 }],
    ['cement', { sand: 9, stone: 8 }],
    ['jewelry', { gold: 9, clay: 8 }],
    ['crystal', { sand: 9, gold: 9 }],
  ])('%s consumes its Materials at once', (item, remaining) => {
    const state = queue(2, item, citizens(5));
    expect(state.storage.materials).toMatchObject(remaining);
  });

  it('never needs a Good in a Good recipe', () => {
    for (const good of Object.values(GOODS)) {
      expect(Object.keys(good.recipe).every((ingredient) => isMaterial(ingredient))).toBe(true);
    }
  });
});
