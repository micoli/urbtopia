import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, routeFailure, routeForLine, transportStats, type GameState } from '../index';
import { routeDetails } from './transitService';
import { frontTiles } from '../map/placement';
import { tileKey } from '../map/geometry';
import { validateGameState } from '../../persistence/validate';
import type { Rotation } from '../engine/state';

const ring = (min: number, max: number) => {
  const tiles: { x: number; y: number; kind: 'road' }[] = [];
  for (let i = min; i <= max; i++) tiles.push({ x: i, y: min, kind: 'road' }, { x: i, y: max, kind: 'road' });
  for (let i = min + 1; i < max; i++) tiles.push({ x: min, y: i, kind: 'road' }, { x: max, y: i, kind: 'road' });
  return tiles;
};

function stopAt(id: number, x: number, y: number, roads: readonly { x: number; y: number }[]) {
  const keys = new Set(roads.map(tileKey));
  const rotation = ([0, 1, 2, 3] as Rotation[]).find(r => frontTiles('busStop', x, y, r).some(p => keys.has(tileKey(p))))!;
  return createBuilding(id, 'busStop', x, y, rotation);
}

function loopCity(): GameState {
  const roads = ring(10, 20);
  const home = { ...createBuilding(1, 'home', 14, 14, 0), tier: 8 };
  return { ...newGame({ seed: 'loop', now: 0 }), roads, roundabouts: [], adaptationUntil: 0, nextId: 100, urbs: 100_000,
    buildings: [home, stopAt(2, 11, 10, roads), stopAt(3, 19, 10, roads), stopAt(4, 19, 20, roads), stopAt(5, 11, 20, roads)], busLines: [] };
}

const set = (state: GameState, stops: number[], loop?: boolean, id?: number) => dispatch(state, { type: 'SetBusLine', id, stops, loop }, 0);

describe('loop lines', () => {
  it('closes the route on its first stop and records the closing offset', () => {
    const state = loopCity();
    const open = routeDetails(state, { id: 50, stops: [2, 3, 4] })!;
    const closed = routeDetails(state, { id: 50, stops: [2, 3, 4], loop: true })!;
    expect(closed.route[closed.route.length - 1]).toEqual(closed.route[0]);
    expect(closed.offsets).toHaveLength(4);
    expect(closed.offsets[3]).toBe(closed.route.length - 1);
    expect(closed.route.length).toBeGreaterThan(open.route.length);
  });

  it('needs three stops', () => {
    const state = loopCity();
    expect(routeFailure(state, { id: 50, stops: [2, 3], loop: true })).toBe('invalid');
    expect(set(state, [2, 3], true).ok).toBe(false);
    expect(set(state, [2, 3, 4], true).ok).toBe(true);
  });

  it('is disconnected when the road is cut, like an open line', () => {
    const state = loopCity();
    const cut = { ...state, roads: state.roads.filter(p => !(p.x === 10 && p.y === 15) && !(p.x === 20 && p.y === 15)) };
    expect(routeFailure(cut, { id: 50, stops: [2, 3, 4], loop: true })).toBe('notConnected');
    expect(routeForLine(cut, { id: 50, stops: [2, 3, 4] })).toBeNull();
    expect(routeForLine(state, { id: 50, stops: [2, 3, 4] })).not.toBeNull();
  });

  it('is stored only when set and cleared by resaving without it', () => {
    const state = loopCity();
    const looped = set(state, [2, 3, 4, 5], true);
    if (!looped.ok) throw new Error(looped.error.key);
    expect(looped.state.busLines![0]!.loop).toBe(true);
    const id = looped.state.busLines![0]!.id;
    const open = set(looped.state, [2, 3, 4, 5], undefined, id);
    if (!open.ok) throw new Error(open.error.key);
    expect(open.state.busLines![0]).toEqual({ id, stops: [2, 3, 4, 5] });
  });

  it('travels one way only: the previous stop is reached by going around', () => {
    const state = { ...loopCity(), busLines: [{ id: 50, stops: [2, 3, 4], loop: true }] };
    const line = transportStats(state).lines[0]!;
    expect(line.loop).toBe(true);
    expect(line.offsets[3]).toBe(line.route!.length - 1);
  });

  it('validates the flag in saves', () => {
    const state = { ...loopCity(), busLines: [{ id: 50, stops: [2, 3, 4], loop: true }] };
    expect(validateGameState(JSON.parse(JSON.stringify(state)))).not.toBeNull();
    const short = { ...state, busLines: [{ id: 50, stops: [2, 3], loop: true }] };
    expect(validateGameState(JSON.parse(JSON.stringify(short)))).toBeNull();
    const falsy = { ...state, busLines: [{ id: 50, stops: [2, 3, 4], loop: false }] };
    expect(validateGameState(JSON.parse(JSON.stringify(falsy)))).toBeNull();
  });
});
