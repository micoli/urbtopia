import { describe, expect, it } from 'vitest';
import { advance, dispatch, newGame, type Command, type GameState } from '../index';
import { createBuilding } from '../buildings/buildingSpecs';
import { utilityDemand } from '../buildings/city';
import { cityGreenBenefits } from '../environment/ecology';
import { orchardWaterDemandOf } from './orchards';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;
const CITIZENS = 700;

function succeed(state: GameState, command: Command, now = T0): GameState {
  const result = dispatch(state, command, now);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

const homes = Array.from({ length: CITIZENS / 4 }, (_, index) => ({ ...createBuilding(100 + index, 'home', 44 + index, 60, 0), tier: 4 }));
const base = newGame({ seed: 'orchard-perennials', now: T0 });
const city: GameState = { ...base, urbs: 100_000, buildings: [...base.buildings, ...homes, createBuilding(901, 'storehouse', 50, 50, 0), createBuilding(902, 'grainSilo', 50, 54, 0)] };
const placed = (type: 'hive' | 'mulberryTree') => {
  const state = succeed(city, { type: 'PlaceBuilding', buildingType: type, x: 56, y: 57 });
  return { state, tree: state.buildings.find((building) => building.type === type)! };
};

describe.each([
  ['hive', 'honey', 24],
  ['mulberryTree', 'mulberryLeaf', 20],
] as const)('%s', (type, item, minutes) => {
  it(`starts its first ${item} cycle when placed`, () => {
    expect(placed(type).tree.queue).toEqual([{ item, duration: minutes * MINUTE, startedAt: base.lastSeen, done: false, quantity: 1 }]);
  });

  it('is harvested by Collect, then starts a new cycle', () => {
    const { state, tree } = placed(type);
    const ready = advance(state, tree.queue[0]!.startedAt! + (minutes + 1) * MINUTE).state;
    const collected = succeed(ready, { type: 'Collect', buildingId: tree.id }, ready.lastSeen);
    expect(collected.storage.materials[item]).toBe(1);
    expect(collected.buildings.find((building) => building.id === tree.id)!.queue).toEqual([expect.objectContaining({ item, done: false })]);
  });

  it('is lost with its ready produce when removed', () => {
    const { state, tree } = placed(type);
    const ready = advance(state, tree.queue[0]!.startedAt! + (minutes + 1) * MINUTE).state;
    const removed = succeed(ready, { type: 'SellBuilding', id: tree.id });
    expect(removed.storage.materials[item]).toBeUndefined();
  });
});

describe('water and ecology', () => {
  it('a Hive needs no water, a Mulberry tree needs one unit', () => {
    expect(orchardWaterDemandOf('hive')).toBe(0);
    expect(orchardWaterDemandOf('mulberryTree')).toBe(1);
    expect(orchardWaterDemandOf('cherryTree')).toBe(1);
    expect(utilityDemand(placed('hive').state).water).toBe(utilityDemand(city).water);
    expect(utilityDemand(placed('mulberryTree').state).water).toBe(utilityDemand(city).water + 1);
  });

  it('a Hive gives biodiversity and Well-being but no cooling', () => {
    const before = cityGreenBenefits(city);
    const after = cityGreenBenefits(placed('hive').state);
    expect(after.cooling).toBe(before.cooling);
    expect(after.biodiversity).toBeGreaterThan(before.biodiversity);
  });
});
