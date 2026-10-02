import { describe, expect, it } from 'vitest';
import { dispatch, newGame, type Command, type GameState } from './index';

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

function queue(buildingId: number, item: string): GameState {
  const command: Command = { type: 'QueueProduction', buildingId, item };
  const result = dispatch(city, command, T0);
  if (!result.ok) throw new Error(`${item}: ${result.error.key}`);
  return result.state;
}

const entryOf = (state: GameState, buildingId: number) => state.buildings.find((b) => b.id === buildingId)?.queue[0];

describe('Materials of the full economy', () => {
  it.each([
    ['clay', 4],
    ['metal', 8],
    ['silicon', 16],
  ])('%s takes %d minutes in a Workshop', (item, minutes) => {
    expect(entryOf(queue(1, item), 1)?.duration).toBe(minutes * MINUTE);
  });
});

describe('Goods of the full economy', () => {
  it.each([
    ['tiles', 6, { clay: 8 }],
    ['tools', 8, { metal: 9, wood: 9 }],
    ['glass', 12, { clay: 8, silicon: 9 }],
    ['circuits', 16, { metal: 9, silicon: 9 }],
  ])('%s takes %d minutes and uses its recipe', (item, minutes, remaining) => {
    const state = queue(2, item);
    expect(entryOf(state, 2)?.duration).toBe(minutes * MINUTE);
    expect(state.storage.materials).toMatchObject(remaining);
  });
});
