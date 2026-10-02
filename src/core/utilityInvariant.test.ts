import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { dispatch, newGame, utilityCapacity, utilityDemand, type Command } from './index';

const T0 = 1_700_000_000_000;

const spotArb = fc.record({ x: fc.integer({ min: 50, max: 64 }), y: fc.constantFrom(55, 57, 59, 60, 70) });

const commandArb: fc.Arbitrary<Command> = fc.oneof(
  spotArb.map(({ x, y }): Command => ({ type: 'PlaceBuilding', buildingType: 'home', x, y })),
  spotArb.map(({ x, y }): Command => ({ type: 'PlaceBuilding', buildingType: 'powerPlant', x, y })),
  spotArb.map(({ x, y }): Command => ({ type: 'PlaceBuilding', buildingType: 'waterTower', x, y })),
  fc.integer({ min: 1, max: 40 }).map((id): Command => ({ type: 'SellBuilding', id })),
  fc.integer({ min: 1, max: 40 }).map((id): Command => ({ type: 'UpgradeHome', buildingId: id })),
);

describe('utility invariant', () => {
  it('never lets Demand exceed Capacity, whatever the valid commands played', () => {
    fc.assert(
      fc.property(fc.array(commandArb, { maxLength: 60 }), (commands) => {
        let state = { ...newGame({ seed: 'amber-fox-4821', now: T0 }), urbs: 1_000_000 };
        for (const command of commands) {
          const result = dispatch(state, command, T0);
          if (result.ok) state = result.state;
          const capacity = utilityCapacity(state);
          const demand = utilityDemand(state);
          expect(demand.power).toBeLessThanOrEqual(capacity.power);
          expect(demand.water).toBeLessThanOrEqual(capacity.water);
        }
      }),
      { numRuns: 200 },
    );
  });
});
