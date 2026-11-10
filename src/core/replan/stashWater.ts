import { boatsOf, boatsOfMarina, hostOf, isCoveBoatFamily } from '../water/boats';
import { bridgeAt, bridgeKeys, placeBridge, withoutBridge } from '../water/bridges';
import { bridgeRamps, isInfrastructureBridge, isPedestrianBridge } from '../water/bridgeGeometry';
import { connectedWaterKeys, marinaCapacity } from '../water/marina';
import { pirateShipRoom } from '../water/pirateCove';
import { tileKey } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { Bridge, GameState } from '../engine/state';
import { stashOf, withStash, type StashOutcome } from './stash';

export function liftBridge(state: GameState, at: Coord): StashOutcome {
  const bridge = bridgeAt(state, at);
  if (!bridge) return { key: 'error.noBridgeHere' };
  return { state: withStash(withoutBridge(state, bridge), { bridges: [...(stashOf(state).bridges ?? []), bridge] }) };
}

// The Bridge keeps its length, Carrier and tier and is placed under the rules of a new one, for free.
export function placeStashedBridge(state: GameState, index: number, target: Pick<Bridge, 'x' | 'y' | 'axis' | 'side'>): StashOutcome {
  const bridge = stashOf(state).bridges?.[index];
  if (!state.replan || !bridge) return { key: 'error.unknownCommand' };
  const placed: Bridge = { x: target.x, y: target.y, length: bridge.length, axis: target.axis, ...(bridge.carrier ? { carrier: bridge.carrier } : {}), ...(isPedestrianBridge(bridge) && target.side ? { side: target.side } : {}) };
  const outcome = placeBridge({ ...state, urbs: Number.MAX_SAFE_INTEGER }, placed);
  if (!('state' in outcome)) return { key: outcome.key };
  const tier = bridge.tier;
  const bridges = (outcome.state.bridges ?? []).map((candidate) => (candidate.x === placed.x && candidate.y === placed.y && candidate.axis === placed.axis && tier !== undefined ? { ...candidate, tier } : candidate));
  const ramps = new Set(bridgeRamps(placed).map(tileKey));
  const roads = tier === undefined || !isInfrastructureBridge(placed) ? outcome.state.roads : outcome.state.roads.map((road) => (ramps.has(tileKey(road)) ? { ...road, tier } : road));
  const stashed = (stashOf(state).bridges ?? []).filter((_, position) => position !== index);
  return { state: withStash({ ...outcome.state, urbs: state.urbs, bridges, roads }, { bridges: stashed }) };
}

export function liftBoat(state: GameState, id: number): StashOutcome {
  const boat = boatsOf(state).find((candidate) => candidate.id === id);
  if (!boat) return { key: 'error.unknownBoat' };
  return { state: withStash({ ...state, boats: boatsOf(state).filter((candidate) => candidate !== boat) }, { boats: [...(stashOf(state).boats ?? []), boat] }) };
}

// The Boat keeps its id, family, Marina and tier; it needs its Marina or Pirate cove to be on the map and the Water to reach it.
export function placeStashedBoat(state: GameState, id: number, tile: Coord): StashOutcome {
  const boat = stashOf(state).boats?.find((candidate) => candidate.id === id);
  if (!state.replan || !boat) return { key: 'error.unknownBoat' };
  const host = hostOf(state, boat.family, boat.marinaId);
  if (!host) return { key: 'error.unknownBuilding' };
  if (!connectedWaterKeys(state, host).has(tileKey(tile))) return { key: 'error.notOnMarinaWater' };
  if (boatsOf(state).some((candidate) => tileKey(candidate) === tileKey(tile)) || bridgeKeys(state).has(tileKey(tile))) return { key: 'error.tilesOccupied' };
  if (isCoveBoatFamily(boat.family) && pirateShipRoom(state, host) <= 0) return { key: 'error.noWaterForPirateShip' };
  if (!isCoveBoatFamily(boat.family) && boatsOfMarina(state, boat.marinaId).length >= marinaCapacity(host)) return { key: 'error.marinaFull' };
  const stashed = (stashOf(state).boats ?? []).filter((candidate) => candidate !== boat);
  return { state: withStash({ ...state, boats: [...boatsOf(state), { ...boat, x: tile.x, y: tile.y }] }, { boats: stashed }) };
}
