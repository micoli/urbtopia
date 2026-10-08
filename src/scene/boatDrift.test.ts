import { describe, expect, it } from 'vitest';
import type { Coord } from '../core';
import { DRIFT_SPEED, waitingFor, advanceDrift, driftPosition, keyOf, releaseDrift, startDrift, type DriftBoat } from './boatDrift';

function lcg(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const lake = (width: number, depth: number): Set<string> => new Set(Array.from({ length: width * depth }, (_, index) => keyOf({ x: 50 + (index % width), y: 50 + Math.floor(index / width) })));

function fleet(water: Set<string>, anchors: Coord[], random = lcg(1)) {
  const reserved = new Map<string, number>();
  const boats = anchors.map((anchor, index) => startDrift(index + 1, anchor, reserved, random));
  return { boats, context: { water, reserved, random } };
}

function run(boats: DriftBoat[], context: Parameters<typeof advanceDrift>[2], seconds: number, onStep?: () => void) {
  for (let step = 0; step < seconds * 10; step++) {
    for (const boat of boats) advanceDrift(boat, 0.1, context);
    onStep?.();
  }
}

describe('boat drift', () => {
  it('starts on its tile and waits before leaving', () => {
    const { boats } = fleet(lake(3, 3), [{ x: 51, y: 51 }]);
    expect(driftPosition(boats[0]!)).toEqual({ x: 51.5, z: 51.5 });
  });

  it('crosses from one tile centre to the next at the drift speed', () => {
    const { boats, context } = fleet(lake(2, 1), [{ x: 50, y: 50 }]);
    boats[0]!.rest = 0;
    advanceDrift(boats[0]!, 0.1, context);
    expect(boats[0]!.to).toEqual({ x: 51, y: 50 });
    advanceDrift(boats[0]!, 1, context);
    expect(driftPosition(boats[0]!).x).toBeCloseTo(50.5 + DRIFT_SPEED, 5);
    expect(boats[0]!.heading).toBeCloseTo(Math.PI / 2);
  });

  it('never leaves the water', () => {
    const water = lake(4, 3);
    const { boats, context } = fleet(water, [{ x: 50, y: 50 }, { x: 53, y: 52 }]);
    run(boats, context, 600, () => {
      for (const boat of boats) {
        const { x, z } = driftPosition(boat);
        expect(water.has(keyOf({ x: Math.floor(x), y: Math.floor(z) }))).toBe(true);
      }
    });
  });

  it('never puts two boats on the same tile', () => {
    const water = lake(3, 2);
    const anchors = [{ x: 50, y: 50 }, { x: 52, y: 50 }, { x: 50, y: 51 }, { x: 52, y: 51 }];
    const { boats, context } = fleet(water, anchors, lcg(7));
    run(boats, context, 600, () => {
      const occupied = boats.flatMap((boat) => [keyOf(boat.from), ...(boat.to ? [keyOf(boat.to)] : [])]);
      expect(new Set(occupied).size).toBe(occupied.length);
    });
  });

  it('stays put when every neighbour is taken', () => {
    const { boats, context } = fleet(lake(1, 1), [{ x: 50, y: 50 }]);
    run(boats, context, 30);
    expect(driftPosition(boats[0]!)).toEqual({ x: 50.5, z: 50.5 });
  });

  it('goes back to its anchor when its tile is removed', () => {
    const water = lake(3, 1);
    const { boats, context } = fleet(water, [{ x: 50, y: 50 }], lcg(3));
    boats[0]!.from = { x: 52, y: 50 };
    water.delete(keyOf({ x: 52, y: 50 }));
    advanceDrift(boats[0]!, 0.1, context);
    expect(boats[0]!.from).toEqual({ x: 50, y: 50 });
  });

  it('frees its tiles when released', () => {
    const { boats, context } = fleet(lake(2, 1), [{ x: 50, y: 50 }]);
    boats[0]!.rest = 0;
    advanceDrift(boats[0]!, 0.1, context);
    releaseDrift(boats[0]!, context.reserved);
    expect(context.reserved.size).toBe(0);
  });

  it('waits in front of a closed Bridge and asks for it to open', () => {
    const water = lake(2, 1);
    const closedTiles = new Set([keyOf({ x: 51, y: 50 })]);
    const { boats, context } = fleet(water, [{ x: 50, y: 50 }]);
    boats[0]!.rest = 0;
    run(boats, { ...context, closedTiles }, 5);
    expect(boats[0]!.to).toBeNull();
    expect(boats[0]!.want).toEqual({ x: 51, y: 50 });
    expect(waitingFor(boats[0]!, closedTiles)).toBe('51,50');
    expect(driftPosition(boats[0]!)).toEqual({ x: 50.5, z: 50.5 });
  });

  it('goes through as soon as the Bridge is open', () => {
    const water = lake(2, 1);
    const { boats, context } = fleet(water, [{ x: 50, y: 50 }]);
    boats[0]!.rest = 0;
    run(boats, { ...context, closedTiles: new Set([keyOf({ x: 51, y: 50 })]) }, 2);
    run(boats, { ...context, closedTiles: new Set() }, 1);
    expect(boats[0]!.to).toEqual({ x: 51, y: 50 });
    expect(boats[0]!.want).toBeNull();
  });
});
