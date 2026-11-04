import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, TRANSIT, createBuilding, levelUnlocked, newGame, type GameState } from '..';
import { handleCommand, isError, type Command } from '../engine/commands';
import { tripGraph, walkFrom, walkwayNode } from '../map/pedestrianGraph';
import { activeAccesses, disconnectedWalkways } from './walkways';
import { isMetroStationActive, metroStations } from './metro';

const size = GAME_CONFIG.parcelSizeInTiles;
const origin = (() => {
  const parcel = newGame({ seed: 'metro', now: 0 }).ownedParcels[0]!;
  return { x: parcel.x * size + 2, y: parcel.y * size + 2 };
})();
const at = (dx: number, dy: number) => ({ x: origin.x + dx, y: origin.y + dy });

function city(citizens = 300): GameState {
  const base = newGame({ seed: 'metro', now: 0 });
  const homes = Array.from({ length: citizens }, (_, index) => createBuilding(100 + index, 'home', 0, 0, 0));
  return { ...base, urbs: 1_000_000, nextId: 1000, roads: [], roundabouts: [], buildings: homes };
}

function send(state: GameState, command: Command): GameState {
  const outcome = handleCommand(state, command, 0);
  if (isError(outcome)) throw new Error(outcome.key);
  return outcome.state;
}

function failure(state: GameState, command: Command): string {
  const outcome = handleCommand(state, command, 0);
  return isError(outcome) ? outcome.key : 'ok';
}

const withStreet = (state: GameState): GameState => ({ ...state, roads: [at(0, 0), at(1, 0), at(2, 0), at(3, 0)].map((tile) => ({ ...tile, kind: 'road' as const })) });

describe('Tunnels', () => {
  it('open with the Metro, which Level -2 follows', () => {
    expect(levelUnlocked(city(1), -2)).toBe(false);
    expect(levelUnlocked(city(1), 0)).toBe(true);
    expect(levelUnlocked(city(300), -2)).toBe(true);
    expect(failure(city(1), { type: 'BuildTransit', mode: 'metro', from: at(0, 5), to: at(3, 5) })).toBe('error.itemLocked');
  });

  it('are priced per new tile and keep their exits joined', () => {
    const state = city();
    const built = send(state, { type: 'BuildTransit', mode: 'metro', from: at(0, 5), to: at(3, 5) });
    expect(built.tunnels).toHaveLength(4);
    expect(state.urbs - built.urbs).toBe(4 * TRANSIT.metro.tileCost);
    const [first, second] = built.tunnels!;
    expect(first!.exits).toEqual(['E']);
    expect(second!.exits).toEqual(expect.arrayContaining(['W', 'E']));
    const extended = send(built, { type: 'BuildTransit', mode: 'metro', from: at(3, 5), to: at(3, 7), horizontalFirst: false });
    expect(extended.tunnels).toHaveLength(6);
    expect(built.urbs - extended.urbs).toBe(2 * TRANSIT.metro.tileCost);
  });

  it('run under roads, buildings, Water and Bridges without any conflict, and cross the other networks', () => {
    const state = { ...withStreet(city()), waterTiles: [at(1, 1)], rails: [{ ...at(2, 1), exits: ['E' as const, 'W' as const] }], buildings: [...city().buildings, createBuilding(2000, 'shop', origin.x, origin.y + 1, 0)], nextId: 3000 };
    const built = send(state, { type: 'BuildTransit', mode: 'metro', from: at(0, 1), to: at(3, 1) });
    expect(built.tunnels).toHaveLength(4);
    expect(built.rails).toEqual(state.rails);
    const along = send(built, { type: 'BuildTransit', mode: 'metro', from: at(0, 0), to: at(3, 0) });
    expect(along.tunnels).toHaveLength(8);
  });

  it('stay on owned land', () => {
    expect(failure(city(), { type: 'BuildTransit', mode: 'metro', from: { x: -3, y: 0 }, to: { x: 2, y: 0 } })).toBe('error.outsideOwnedParcels');
  });

  it('are demolished tile by tile, leaving a station where it stands', () => {
    const built = send(city(), { type: 'BuildTransit', mode: 'metro', from: at(0, 5), to: at(3, 5) });
    const cut = send(built, { type: 'DemolishTransit', mode: 'metro', from: at(1, 5), to: at(2, 5) });
    expect(cut.tunnels!.map((tile) => `${tile.x},${tile.y}`)).toEqual([`${at(0, 5).x},${at(0, 5).y}`, `${at(3, 5).x},${at(3, 5).y}`]);
    expect(cut.tunnels!.every((tile) => tile.exits.length === 0)).toBe(true);
  });
});

describe('Metro stations', () => {
  const placed = (state: GameState) => send(withStreet(state), { type: 'PlaceBuilding', buildingType: 'metroStation', x: at(0, 1).x, y: at(0, 1).y });

  it('stand against a road, unlocked with the Metro', () => {
    expect(failure(withStreet(city(1)), { type: 'PlaceBuilding', buildingType: 'metroStation', x: at(0, 1).x, y: at(0, 1).y })).toBe('error.itemLocked');
    expect(metroStations(placed(city()))).toHaveLength(1);
  });

  it('are inactive until a Tunnel runs under them', () => {
    const state = placed(city());
    const station = metroStations(state)[0]!;
    expect(isMetroStationActive(state, station)).toBe(false);
    const dug = send(state, { type: 'BuildTransit', mode: 'metro', from: at(0, 1), to: at(0, 4), horizontalFirst: false });
    expect(isMetroStationActive(dug, station)).toBe(true);
  });

  it('are a stair to Level -1 where a walkway lies under them', () => {
    let state = placed(city());
    const station = metroStations(state)[0]!;
    state = send(state, { type: 'BuildWalkway', from: at(0, 1), to: at(0, 4), horizontalFirst: false });
    expect(activeAccesses(state)).toEqual([at(0, 1)]);
    expect(disconnectedWalkways(state)).toEqual([]);
    const walk = walkFrom(tripGraph(state), [walkwayNode(at(0, 4))], 20);
    const out = [...walk.costs.keys()].filter((node) => !node.endsWith(':U'));
    expect(out.length).toBeGreaterThan(0);
    expect(station.type).toBe('metroStation');
  });
});
