import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, createBuilding, newGame, type GameState } from '..';
import { handleCommand, isError, type Command } from '../engine/commands';
import { pedestrianGraph, sidewalkNode, tripGraph, walkFrom, walkwayNode, accessNode } from '../map/pedestrianGraph';
import { PEDESTRIAN_ACCESS_COST, activeAccesses, disconnectedWalkways, walkwayCostPerTile } from './walkways';

const size = GAME_CONFIG.parcelSizeInTiles;
const origin = (() => {
  const parcel = newGame({ seed: 'walkways', now: 0 }).ownedParcels[0]!;
  return { x: parcel.x * size + 2, y: parcel.y * size + 2 };
})();
const at = (dx: number, dy: number) => ({ x: origin.x + dx, y: origin.y + dy });

function citizenCity(urbs = 100_000): GameState {
  const base = newGame({ seed: 'walkways', now: 0 });
  return { ...base, urbs, nextId: 1000, buildings: [], roads: [], roundabouts: [], pedestrianWays: [], ownedParcels: base.ownedParcels };
}

function unlocked(state: GameState): GameState {
  const homes = Array.from({ length: 300 }, (_, index) => createBuilding(100 + index, 'home', 0, 0, 0));
  return { ...state, buildings: homes, nextId: 1000 };
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

describe('Underground walkways', () => {
  it('stay locked until the city has enough Citizens', () => {
    expect(failure(citizenCity(), { type: 'BuildWalkway', from: at(0, 0), to: at(3, 0) })).toBe('error.itemLocked');
  });

  it('are built per tile at twice the price of a Pedestrian way, only on owned land', () => {
    const state = unlocked(citizenCity());
    const built = send(state, { type: 'BuildWalkway', from: at(0, 0), to: at(3, 0) });
    expect(built.walkways).toHaveLength(4);
    expect(state.urbs - built.urbs).toBe(4 * walkwayCostPerTile());
    expect(walkwayCostPerTile()).toBe(2 * Math.round(GAME_CONFIG.roadCostPerTile * 0.9));
    expect(failure(state, { type: 'BuildWalkway', from: { x: -5, y: 0 }, to: { x: -2, y: 0 } })).toBe('error.outsideOwnedParcels');
  });

  it('lie under roads, buildings and Water without any conflict', () => {
    const state = unlocked({ ...citizenCity(), roads: [{ ...at(1, 0), kind: 'road' }], waterTiles: [at(2, 0)], buildings: [...unlocked(citizenCity()).buildings, createBuilding(2000, 'shop', origin.x, origin.y, 0)], nextId: 3000 });
    const built = send(state, { type: 'BuildWalkway', from: at(0, 0), to: at(3, 0) });
    expect(built.walkways).toHaveLength(4);
    expect(built.roads).toEqual(state.roads);
  });

  it('refuse to be built twice', () => {
    const state = send(unlocked(citizenCity()), { type: 'BuildWalkway', from: at(0, 0), to: at(2, 0) });
    expect(failure(state, { type: 'BuildWalkway', from: at(0, 0), to: at(2, 0) })).toBe('error.tilesOccupied');
  });

  it('are demolished tile by tile', () => {
    const state = send(unlocked(citizenCity()), { type: 'BuildWalkway', from: at(0, 0), to: at(3, 0) });
    expect(send(state, { type: 'DemolishWalkwayPath', from: at(1, 0), to: at(2, 0) }).walkways).toEqual([at(0, 0), at(3, 0)]);
    expect(failure(state, { type: 'DemolishWalkwayPath', from: at(0, 5), to: at(1, 5) })).toBe('error.noWalkwayHere');
  });
});

describe('Pedestrian accesses', () => {
  const street = (state: GameState): GameState => ({ ...state, roads: [at(0, 0), at(1, 0), at(2, 0), at(3, 0)].map((tile) => ({ ...tile, kind: 'road' as const })) });

  it('stand on a free tile against a road or a Pedestrian way', () => {
    const state = street(unlocked(citizenCity()));
    expect(failure(state, { type: 'BuildPedestrianAccess', x: at(1, 1).x, y: at(1, 1).y })).toBe('ok');
    expect(failure(state, { type: 'BuildPedestrianAccess', x: at(1, 4).x, y: at(1, 4).y })).toBe('error.accessNeedsPath');
    expect(failure(state, { type: 'BuildPedestrianAccess', x: at(1, 0).x, y: at(1, 0).y })).toBe('error.tilesOccupied');
    const withWay = { ...unlocked(citizenCity()), pedestrianWays: [at(5, 5)] };
    expect(failure(withWay, { type: 'BuildPedestrianAccess', x: at(5, 6).x, y: at(5, 6).y })).toBe('ok');
  });

  it('cost a flat price and are active only above a walkway', () => {
    let state = street(unlocked(citizenCity()));
    const before = state.urbs;
    state = send(state, { type: 'BuildPedestrianAccess', x: at(1, 1).x, y: at(1, 1).y });
    expect(before - state.urbs).toBe(PEDESTRIAN_ACCESS_COST);
    expect(activeAccesses(state)).toEqual([]);
    state = send(state, { type: 'BuildWalkway', from: at(1, 1), to: at(1, 3) });
    expect(activeAccesses(state)).toEqual([at(1, 1)]);
  });

  it('leave the walkway in place when demolished, and the walkway is then disconnected', () => {
    let state = street(unlocked(citizenCity()));
    state = send(state, { type: 'BuildPedestrianAccess', x: at(1, 1).x, y: at(1, 1).y });
    state = send(state, { type: 'BuildWalkway', from: at(1, 1), to: at(1, 3) });
    expect(disconnectedWalkways(state)).toEqual([]);
    state = send(state, { type: 'DemolishPedestrianAccess', x: at(1, 1).x, y: at(1, 1).y });
    expect(state.walkways).toHaveLength(3);
    expect(disconnectedWalkways(state)).toHaveLength(3);
  });

  it('leave a walkway disconnected when no access reaches it, even if another group has one', () => {
    let state = street(unlocked(citizenCity()));
    state = send(state, { type: 'BuildPedestrianAccess', x: at(1, 1).x, y: at(1, 1).y });
    state = send(state, { type: 'BuildWalkway', from: at(1, 1), to: at(1, 2) });
    state = send(state, { type: 'BuildWalkway', from: at(8, 8), to: at(9, 8) });
    expect(disconnectedWalkways(state)).toEqual([at(8, 8), at(9, 8)]);
  });
});

describe('the trip graph', () => {
  function twoStairs(): GameState {
    let state: GameState = { ...unlocked(citizenCity()), roads: [at(0, 0), at(1, 0), at(2, 0), at(3, 0)].map((tile) => ({ ...tile, kind: 'road' as const })) };
    state = send(state, { type: 'BuildPedestrianAccess', x: at(0, 1).x, y: at(0, 1).y });
    state = send(state, { type: 'BuildPedestrianAccess', x: at(3, 1).x, y: at(3, 1).y });
    return send(state, { type: 'BuildWalkway', from: at(0, 1), to: at(3, 1) });
  }

  it('is the Surface graph itself without walkways', () => {
    const state = unlocked(citizenCity());
    expect(tripGraph(state)).toBe(pedestrianGraph(state));
  });

  it('joins a walkway to the sidewalk beside its stair, and the two stairs through the walkway', () => {
    const state = twoStairs();
    const graph = tripGraph(state);
    expect(graph.has(walkwayNode(at(1, 1)))).toBe(true);
    const walk = walkFrom(graph, [accessNode(at(0, 1))], 20);
    expect(walk.costs.get(walkwayNode(at(0, 1)))).toBe(2);
    expect(walk.costs.get(walkwayNode(at(3, 1)))).toBe(2 + 3);
    expect(walk.costs.get(sidewalkNode(at(0, 0), 'S'))).toBe(1);
  });

  it('leaves the Surface graph and its crossings untouched', () => {
    const state = twoStairs();
    const surface = pedestrianGraph(state);
    expect(surface.has(walkwayNode(at(1, 1)))).toBe(false);
    expect([...tripGraph(state).values()].flat().every((edge) => edge.crossing === null || surface.has(edge.to))).toBe(true);
  });

  it('ignores an inactive access: no walkway under it, no node', () => {
    let state: GameState = { ...unlocked(citizenCity()), roads: [at(0, 0), at(1, 0)].map((tile) => ({ ...tile, kind: 'road' as const })) };
    state = send(state, { type: 'BuildPedestrianAccess', x: at(0, 1).x, y: at(0, 1).y });
    state = send(state, { type: 'BuildWalkway', from: at(5, 5), to: at(6, 5) });
    expect(tripGraph(state).has(accessNode(at(0, 1)))).toBe(false);
  });
});
