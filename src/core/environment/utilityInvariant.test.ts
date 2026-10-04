import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { energyStats, dispatch, newGame, utilityCapacity, utilityDemand, type Command } from '../index';

const T0 = 1_700_000_000_000;

const spotArb = fc.record({ x: fc.integer({ min: 50, max: 64 }), y: fc.constantFrom(55, 57, 59, 60, 70) });

const commandArb: fc.Arbitrary<Command> = fc.oneof(
  spotArb.map(({ x, y }): Command => ({ type: 'PlaceBuilding', buildingType: 'home', x, y })),
  spotArb.map(({ x, y }): Command => ({ type: 'PlaceBuilding', buildingType: 'powerPlant', x, y })),
  spotArb.map(({ x, y }): Command => ({ type: 'PlaceBuilding', buildingType: 'waterTower', x, y })),
  spotArb.map(({ x, y }): Command => ({ type: 'PlaceBuilding', buildingType: 'farm', x, y })),
  fc.array(spotArb, { minLength: 1, maxLength: 6 }).map((tiles): Command => ({ type: 'LayFields', tiles: tiles.map(({ x, y }) => ({ x, y: y - 8 })) })),
  fc.constantFrom('wheat', 'grass', 'rice').map((crop): Command => ({ type: 'BuySeeds', crop, quantity: 10 })),
  fc.tuple(fc.constantFrom('wheat', 'grass', 'rice'), fc.array(spotArb, { minLength: 1, maxLength: 6 })).map(([crop, tiles]): Command => ({ type: 'Plant', crop, tiles: tiles.map(({ x, y }) => ({ x, y: y - 8 })) })),
  fc.constantFrom(0.02, 0.1, 1).map((hours): Command => ({ type: 'SkipTime', hours })),
  fc.integer({ min: 1, max: 40 }).map((id): Command => ({ type: 'SellBuilding', id })),
  fc.integer({ min: 1, max: 40 }).map((id): Command => ({ type: 'UpgradeBuilding', buildingId: id })),
);

describe('utility invariant', () => {
  it('preserves water capacity and bounded energy allocation under valid commands', () => {
    fc.assert(
      fc.property(fc.array(commandArb, { maxLength: 60 }), (commands) => {
        let state = { ...newGame({ seed: 'amber-fox-4821', now: T0 }), urbs: 1_000_000 };
        for (const command of commands) {
          const result = dispatch(state, command, T0);
          if (result.ok) state = result.state;
          const capacity = utilityCapacity(state);
          const demand = utilityDemand(state);
          const energy = energyStats(state);
          expect(energy.unmet).toBeGreaterThanOrEqual(-1e-9);
          expect([...energy.supplied.values()].reduce((n,x)=>n+x,0)).toBeLessThanOrEqual(energy.demand + 1e-9);
          expect([...energy.supplied.values()].reduce((n,x)=>n+x,0) + energy.unmet).toBeCloseTo(energy.demand);
          expect(demand.water).toBeLessThanOrEqual(capacity.water);
        }
      }),
      { numRuns: 200 },
    );
  });
});
