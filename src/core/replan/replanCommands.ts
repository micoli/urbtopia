import { bridgesOf } from '../water/bridges';
import type { Coord } from '../map/coord';
import type { CommandOutcome, ErrorKey } from '../engine/commands';
import type { GameState, NetworkMode, Rotation, Stash } from '../engine/state';
import { layoutOf } from './layout';
import { liftBuilding, placeStashedBuilding, type StashOutcome } from './stash';
import { liftNetwork, placeStashedNetwork } from './stashNetworks';
import { liftTiles, placeStashedTiles, type TileLayer } from './stashTiles';
import { liftBoat, liftBridge, placeStashedBoat, placeStashedBridge } from './stashWater';
import { withoutTransitLines } from './transitLines';

export type ReplanAction =
  | { readonly kind: 'liftBuilding'; readonly id: number }
  | { readonly kind: 'placeBuilding'; readonly id: number; readonly x: number; readonly y: number; readonly rotation: Rotation }
  | { readonly kind: 'liftTiles'; readonly layer: TileLayer; readonly tiles: readonly Coord[] }
  | { readonly kind: 'placeTiles'; readonly layer: TileLayer; readonly tiles: readonly Coord[]; readonly tier?: number; readonly crossing?: boolean }
  | { readonly kind: 'liftNetwork'; readonly mode: NetworkMode; readonly tiles?: readonly Coord[] }
  | { readonly kind: 'placeNetwork'; readonly mode: NetworkMode; readonly from: Coord; readonly to: Coord; readonly horizontalFirst?: boolean }
  | { readonly kind: 'liftBridge'; readonly at: Coord }
  | { readonly kind: 'placeBridge'; readonly index: number; readonly x: number; readonly y: number; readonly axis: 'x' | 'y'; readonly side?: 1 | -1 }
  | { readonly kind: 'liftBoat'; readonly id: number }
  | { readonly kind: 'placeBoat'; readonly id: number; readonly x: number; readonly y: number };

const fail = (key: ErrorKey): CommandOutcome => ({ key });
const done = (state: GameState): CommandOutcome => ({ state, events: [] });
const outcomeOf = (outcome: StashOutcome): CommandOutcome => ('state' in outcome ? done(outcome.state) : fail(outcome.key));

// A Road tile of the Stash is taken by its tier and by whether it is a Crossing, so that the player can lay each kind where they want it.
function roadMatch(action: Extract<ReplanAction, { kind: 'placeTiles' }>): (tile: Coord) => boolean {
  if (action.layer !== 'roads' && action.layer !== 'pedestrianWays') return () => true;
  return (tile) => {
    const road = tile as { tier?: number; kind?: string };
    return (road.tier ?? 1) === (action.tier ?? 1) && (action.layer !== 'roads' || (road.kind === 'crossing') === (action.crossing ?? false));
  };
}

export function startReplan(state: GameState): CommandOutcome {
  if (state.replan) return fail('error.replanActive');
  if (state.challenge) return fail('error.replanChallenge');
  const unbridged = bridgesOf(state).reduce<GameState>((current, bridge) => {
    const lifted = liftBridge(current, bridge);
    return 'state' in lifted ? lifted.state : current;
  }, state);
  const stash: Stash = {
    buildings: unbridged.buildings,
    roads: unbridged.roads,
    pedestrianWays: unbridged.pedestrianWays ?? [],
    walkways: unbridged.walkways ?? [],
    pedestrianAccesses: unbridged.pedestrianAccesses ?? [],
    waterTiles: unbridged.waterTiles ?? [],
    fields: unbridged.fields,
    roundabouts: unbridged.roundabouts,
    brtRoads: unbridged.brtRoads ?? [],
    rails: unbridged.rails ?? [],
    tunnels: unbridged.tunnels ?? [],
    bridges: unbridged.replan?.stash.bridges ?? [],
    boats: unbridged.boats ?? [],
  };
  const bare: GameState = {
    ...withoutTransitLines(unbridged),
    buildings: [], roads: [], pedestrianWays: [], walkways: [], pedestrianAccesses: [], waterTiles: [], fields: [], roundabouts: [], brtRoads: [], rails: [], tunnels: [], bridges: [], boats: [],
    replan: { stash, start: layoutOf(state) },
  };
  return done(bare);
}

function withoutReplan(state: GameState): GameState {
  const next = { ...state };
  delete next.replan;
  return next;
}

export function cancelReplan(state: GameState): CommandOutcome {
  const start = state.replan?.start;
  if (!start) return fail('error.notInReplan');
  return done({ ...withoutReplan(state), ...start });
}

const isEmpty = (stash: Stash): boolean => Object.values(stash).every((list) => list === undefined || list.length === 0);

export function finishReplan(state: GameState): CommandOutcome {
  if (!state.replan) return fail('error.notInReplan');
  if (!isEmpty(state.replan.stash)) return fail('error.replanStashNotEmpty');
  return done(withoutReplan(state));
}

export function replanAction(state: GameState, action: ReplanAction): CommandOutcome {
  if (!state.replan) return fail('error.notInReplan');
  switch (action.kind) {
    case 'liftBuilding':
      return outcomeOf(liftBuilding(state, action.id));
    case 'placeBuilding':
      return outcomeOf(placeStashedBuilding(state, action.id, action.x, action.y, action.rotation));
    case 'liftTiles':
      return outcomeOf(liftTiles(state, action.layer, action.tiles));
    case 'placeTiles':
      return outcomeOf(placeStashedTiles(state, action.layer, action.tiles, roadMatch(action)));
    case 'liftNetwork':
      return outcomeOf(liftNetwork(state, action.mode, action.tiles));
    case 'placeNetwork':
      return outcomeOf(placeStashedNetwork(state, action.mode, action.from, action.to, action.horizontalFirst ?? true));
    case 'liftBridge':
      return outcomeOf(liftBridge(state, action.at));
    case 'placeBridge':
      return outcomeOf(placeStashedBridge(state, action.index, { x: action.x, y: action.y, axis: action.axis, ...(action.side ? { side: action.side } : {}) }));
    case 'liftBoat':
      return outcomeOf(liftBoat(state, action.id));
    case 'placeBoat':
      return outcomeOf(placeStashedBoat(state, action.id, { x: action.x, y: action.y }));
  }
}
