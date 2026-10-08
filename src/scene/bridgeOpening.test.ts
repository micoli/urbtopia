import { describe, expect, it } from 'vitest';
import type { Bridge } from '../core';
import { CLOSING_SECONDS, MAX_LEAF_ANGLE, MIN_OPEN_SECONDS, OPENING_SECONDS, boatsMayPass, closedBridge, deckBusy, gateEdges, isStoppingTraffic, leafAngle, leafLayout, leafSplit, stepOpening, type BridgeOpening, type OpeningInput } from './bridgeOpening';

const idle: OpeningInput = { requested: false, occupied: false, deckBusy: false };

function run(bridge: BridgeOpening, seconds: number, input: OpeningInput) {
  for (let step = 0; step < seconds * 10; step++) stepOpening(bridge, 0.1, input);
}

describe('leaves of a Bridge', () => {
  it.each([
    [1, [1]],
    [2, [1, 1]],
    [3, [2, 1]],
    [5, [3, 2]],
  ])('a %i-tile Bridge has the leaves %j', (length, leaves) => {
    expect(leafSplit(length)).toEqual(leaves);
  });

  it.each([
    [1, [{ hinge: 0, direction: 1, tiles: 1 }]],
    [2, [{ hinge: 0, direction: 1, tiles: 1 }, { hinge: 2, direction: -1, tiles: 1 }]],
    [3, [{ hinge: 0, direction: 1, tiles: 2 }, { hinge: 3, direction: -1, tiles: 1 }]],
    [5, [{ hinge: 0, direction: 1, tiles: 3 }, { hinge: 5, direction: -1, tiles: 2 }]],
  ])('hinges the leaves of a %i-tile Bridge on its two banks: %j', (length, layout) => {
    expect(leafLayout(length)).toEqual(layout);
  });

  it('rises from flat to the maximum angle with a smooth start and end', () => {
    expect(leafAngle(0)).toBe(0);
    expect(leafAngle(1)).toBeCloseTo(MAX_LEAF_ANGLE);
    expect(leafAngle(0.1)).toBeLessThan(0.1 * MAX_LEAF_ANGLE);
    expect(leafAngle(0.9)).toBeGreaterThan(0.9 * MAX_LEAF_ANGLE);
  });
});

describe('opening a Bridge', () => {
  it('stays closed and lets the traffic through while no Boat asks', () => {
    const bridge = closedBridge();
    run(bridge, 10, idle);
    expect(bridge).toMatchObject({ phase: 'closed', openness: 0 });
    expect(isStoppingTraffic(bridge)).toBe(false);
  });

  it('stops the traffic as soon as a Boat asks, and waits for the deck to clear', () => {
    const bridge = closedBridge();
    run(bridge, 5, { requested: true, occupied: false, deckBusy: true });
    expect(bridge).toMatchObject({ phase: 'waiting', openness: 0 });
    expect(isStoppingTraffic(bridge)).toBe(true);
    expect(boatsMayPass(bridge)).toBe(false);
  });

  it('opens once the deck is clear, then lets the Boats through', () => {
    const bridge = closedBridge();
    run(bridge, 0.1, { requested: true, occupied: false, deckBusy: false });
    run(bridge, 0.1, { requested: true, occupied: false, deckBusy: false });
    expect(bridge.phase).toBe('opening');
    expect(boatsMayPass(bridge)).toBe(false);
    run(bridge, OPENING_SECONDS + 0.2, { requested: true, occupied: false, deckBusy: false });
    expect(bridge).toMatchObject({ phase: 'open', openness: 1 });
    expect(boatsMayPass(bridge)).toBe(true);
  });

  it('gives up waiting when the Boat leaves before the deck is clear', () => {
    const bridge = closedBridge();
    run(bridge, 1, { requested: true, occupied: false, deckBusy: true });
    run(bridge, 0.2, { requested: false, occupied: false, deckBusy: true });
    expect(bridge.phase).toBe('closed');
  });

  it('stays open while a Boat is under it, at least a moment', () => {
    const bridge: BridgeOpening = { phase: 'open', openness: 1, hold: MIN_OPEN_SECONDS };
    run(bridge, 20, { requested: false, occupied: true, deckBusy: false });
    expect(bridge.phase).toBe('open');
    run(bridge, 0.2, { requested: true, occupied: false, deckBusy: false });
    expect(bridge.phase).toBe('open');
  });

  it('closes after the last Boat is gone, and releases the traffic only once flat', () => {
    const bridge: BridgeOpening = { phase: 'open', openness: 1, hold: 0 };
    run(bridge, 0.1, idle);
    expect(bridge.phase).toBe('closing');
    expect(isStoppingTraffic(bridge)).toBe(true);
    expect(boatsMayPass(bridge)).toBe(false);
    run(bridge, CLOSING_SECONDS / 2, idle);
    expect(bridge.openness).toBeCloseTo(0.5, 1);
    expect(isStoppingTraffic(bridge)).toBe(true);
    run(bridge, CLOSING_SECONDS, idle);
    expect(bridge).toMatchObject({ phase: 'closed', openness: 0 });
    expect(isStoppingTraffic(bridge)).toBe(false);
  });
});

describe('Vehicles and the deck', () => {
  const deck = new Set(['52,50', '53,50', '54,50']);
  const car = (from: [number, number], to: [number, number], progress: number) => ({ from: { x: from[0], y: from[1] }, to: { x: to[0], y: to[1] }, progress });

  it('blocks only the entries of the Bridge', () => {
    const bridge: Bridge = { x: 52, y: 50, length: 3, axis: 'x' };
    expect(gateEdges(bridge)).toEqual(['51,50>52,50', '55,50>54,50']);
  });

  it('is busy when a car is on a deck tile, in either half of its edge', () => {
    expect(deckBusy([car([53, 50], [54, 50], 0.2)], deck)).toBe(true);
    expect(deckBusy([car([54, 50], [55, 50], 0.4)], deck)).toBe(true);
    expect(deckBusy([car([51, 50], [52, 50], 0.7)], deck)).toBe(true);
  });

  it('is free for a car waiting on the bank or already off the deck', () => {
    expect(deckBusy([car([51, 50], [52, 50], 0.3)], deck)).toBe(false);
    expect(deckBusy([car([54, 50], [55, 50], 0.6)], deck)).toBe(false);
    expect(deckBusy([], deck)).toBe(false);
  });
});
