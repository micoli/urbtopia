import { utilityCapacity, utilityDemand } from '../buildings/city';
import { canRemoveStorage, isStorageType } from '../economy/storage';
import { isProductionType } from '../economy/productionTypes';
import { isPirateCoveInUse } from '../water/pirateCove';
import type { Coord } from '../map/coord';
import type { CommandOutcome, ErrorKey } from '../engine/commands';
import type { GameState, NetworkMode, Rotation, Stash } from '../engine/state';
import { liftBuilding, placeStashedBuilding, type StashOutcome } from './stash';
import { liftNetwork, placeStashedNetwork } from './stashNetworks';
import { liftTiles, placeStashedTiles, type TileLayer } from './stashTiles';
import { liftBoat, liftBridge, placeStashedBoat, placeStashedBridge } from './stashWater';
import { takeGroup, type DropGroup } from './value';
import { liftZone, type ReplanArea } from './zone';

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
  | { readonly kind: 'placeBoat'; readonly id: number; readonly x: number; readonly y: number }
  | { readonly kind: 'drop'; readonly group: DropGroup }
  | { readonly kind: 'setLater'; readonly id: string; readonly later: boolean };

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

export function startReplan(state: GameState, area?: ReplanArea): CommandOutcome {
  if (state.replan) return fail('error.replanActive');
  if (state.challenge) return fail('error.replanChallenge');
  const lifted = liftZone(state, area);
  return lifted ? done(lifted) : fail('error.replanNothingInZone');
}

function withoutReplan(state: GameState): GameState {
  const next = { ...state };
  delete next.replan;
  return next;
}

export function cancelReplan(state: GameState): CommandOutcome {
  const start = state.replan?.start;
  if (!start) return fail('error.notInReplan');
  return done({ ...withoutReplan(state), ...start, urbs: state.urbs - (state.replan?.refunded ?? 0) });
}

const isEmpty = (stash: Stash): boolean => Object.values(stash).every((list) => list === undefined || list.length === 0);

export function finishReplan(state: GameState): CommandOutcome {
  if (!state.replan) return fail('error.notInReplan');
  if (!isEmpty(state.replan.stash)) return fail('error.replanStashNotEmpty');
  return done(withoutReplan(state));
}

// Dropping a Building must leave the City what its stock, its water and its harbours need, counting what is still in the Stash.
function dropRefusal(state: GameState, group: DropGroup): ErrorKey | null {
  if (group.kind !== 'buildings' || !state.replan) return null;
  const dropped = state.replan.stash.buildings.filter((building) => building.type === group.type);
  let virtual: GameState = { ...state, buildings: [...state.buildings, ...state.replan.stash.buildings] };
  for (const building of dropped) {
    if ((isStorageType(building.type) || isProductionType(building.type)) && !canRemoveStorage(virtual, building.id)) return 'error.storageInUse';
    virtual = { ...virtual, buildings: virtual.buildings.filter((candidate) => candidate !== building) };
    if (building.type === 'waterTower' && utilityCapacity(virtual).water < utilityDemand(virtual).water) return 'error.utilityInUse';
    const boats = [...(state.boats ?? []), ...(state.replan.stash.boats ?? [])];
    if (building.type === 'marina' && boats.some((boat) => boat.marinaId === building.id)) return 'error.marinaInUse';
    if (building.type === 'pirateCove' && (isPirateCoveInUse({ ...virtual, buildings: [...virtual.buildings, building] }, building) || boats.some((boat) => boat.marinaId === building.id))) return 'error.pirateCoveInUse';
  }
  return null;
}

function dropGroup(state: GameState, group: DropGroup): CommandOutcome {
  const replan = state.replan!;
  const refusal = dropRefusal(state, group);
  if (refusal) return fail(refusal);
  const { rest, count, value } = takeGroup(replan.stash, group);
  if (count === 0) return fail('error.unknownCommand');
  return done({ ...state, urbs: state.urbs + value, replan: { ...replan, stash: { ...replan.stash, ...rest }, refunded: (replan.refunded ?? 0) + value } });
}

function setLater(state: GameState, id: string, later: boolean): CommandOutcome {
  const replan = state.replan!;
  const others = (replan.later ?? []).filter((known) => known !== id);
  return done({ ...state, replan: { ...replan, later: later ? [...others, id] : others } });
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
    case 'drop':
      return dropGroup(state, action.group);
    case 'setLater':
      return setLater(state, action.id, action.later);
  }
}
