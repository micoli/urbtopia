import { describe, expect, it } from 'vitest';
import { newGame, createBuilding, type Building, type GameState } from '../core';
import { checkGameState } from './validate';

const farm: Record<string, unknown> = { x: 21, y: 52, id: 1034, tier: 3, type: 'livestockFarm', queue: [{ item: 'henEgg', duration: 360000, startedAt: 1794729395764.1267, done: false, quantity: 1, exitId: 1 }], stacks: [],
  interior: { rng: 1728026390, parquet: 0, fixtures: [
    { x: 1, y: 4, id: 1, type: 'livestockPen', rotation: 0, condition: 99.15, recipe: 'henEgg', assigned: true, restockedAt: 1794729432750 },
    { x: 1, y: 0, id: 2, type: 'livestockFeedIntake', rotation: 0, condition: 99.78 },
    { x: 1, y: 1, id: 3, type: 'livestockConveyor', rotation: 0, condition: 99.9 },
    { x: 1, y: 2, id: 4, type: 'livestockConveyor', rotation: 0, condition: 99.9 },
    { id: 5, type: 'livestockFeeder', x: 1, y: 3, rotation: 2, condition: 99.9 },
    { id: 6, type: 'livestockMotor', x: 2, y: 0, rotation: 1, condition: 99.8 },
    { id: 7, type: 'livestockCollectionExit', x: 3, y: 4, rotation: 1 },
    { id: 8, type: 'livestockConveyor', x: 2, y: 4, rotation: 3 } ], nextFixtureId: 9, staff: { herder: 1 } },
  rotation: 3, slotCount: 4, taxCitizenMs: 0 };
// A Livestock farm saved when the herder was assigned to a Pen: the Pen keeps its assignment and the time of its last turn, and the save still loads.
describe('a save made with the herder assigned to a Pen', () => {
  it('still loads', () => {
    const base: GameState = { ...newGame({ seed: 'old', now: 0 }), nextId: 5000 };
    const state = { ...base, buildings: [...base.buildings, { ...createBuilding(1034, 'livestockFarm', 21, 52, 3), ...(farm as Partial<Building>) }] };
    expect(checkGameState(JSON.parse(JSON.stringify(state))).ok).toBe(true);
  });
});
