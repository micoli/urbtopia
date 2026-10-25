import { describe, expect, it } from 'vitest';
import { createBuilding } from '../buildings/buildingSpecs';
import type { Building, QueueEntry } from '../engine/state';
import { penAnimalsOf } from './pens';

const T0 = 1_700_000_000_000;
const MINUTE = 60_000;

const entry = (item: QueueEntry['item'], state: 'running' | 'waiting' | 'done'): QueueEntry => ({
  item,
  duration: 10 * MINUTE,
  startedAt: state === 'waiting' ? null : T0,
  done: state === 'done',
  quantity: 1,
});

const farm = (tier: number, queue: QueueEntry[]): Building => ({ ...createBuilding(1, 'livestockFarm', 50, 50, 0), tier, queue });

describe('Pens of the Livestock farm', () => {
  it('stay empty while nothing is produced', () => {
    expect(penAnimalsOf(farm(5, []))).toEqual([]);
  });

  it('show the animal of the production running', () => {
    expect(penAnimalsOf(farm(1, [entry('henEgg', 'running')]))).toEqual([{ x: 0.64, z: -0.74, animal: 'animals-hen' }]);
  });

  it('show the animal of each production waiting to be collected, then the running one, pen by pen', () => {
    const animals = penAnimalsOf(farm(3, [entry('milk', 'done'), entry('wool', 'done'), entry('goatMilk', 'running')]));
    expect(animals.map(({ animal }) => animal)).toEqual(['animals-cow', 'animals-sheep', 'animals-goat']);
    expect(animals.map(({ x }) => x)).toEqual([0.64, 0, -0.64]);
  });

  it('ignore a production still waiting for its Slot', () => {
    expect(penAnimalsOf(farm(2, [entry('duckEgg', 'running'), entry('silk', 'waiting')])).map(({ animal }) => animal)).toEqual(['animals-duck']);
  });

  it('hold no more animals than the Tier has pens', () => {
    const queue = [entry('henEgg', 'done'), entry('duckEgg', 'done'), entry('milk', 'running')];
    expect(penAnimalsOf(farm(2, queue)).map(({ animal }) => animal)).toEqual(['animals-hen', 'animals-duck']);
  });

  it('give every species its own animal', () => {
    const queue = (['henEgg', 'duckEgg', 'milk', 'wool', 'goatMilk'] as const).map((item) => entry(item, 'done'));
    expect(penAnimalsOf(farm(5, queue)).map(({ animal }) => animal)).toEqual(['animals-hen', 'animals-duck', 'animals-cow', 'animals-sheep', 'animals-goat']);
    expect(penAnimalsOf(farm(5, [entry('alpacaWool', 'done'), entry('silk', 'running')])).map(({ animal }) => animal)).toEqual(['animals-alpaca', 'animals-silkworm']);
  });

  it('show nothing for a building without pens or a production without an animal', () => {
    expect(penAnimalsOf({ ...createBuilding(2, 'mill', 50, 50, 0), queue: [entry('flour', 'running')] })).toEqual([]);
    expect(penAnimalsOf(farm(1, [entry('honey', 'running')]))).toEqual([]);
  });
});
