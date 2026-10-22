import { citizenCount } from '../environment/ecology';
import { GAME_CONFIG } from '../engine/config';
import { isInsideOwnedParcels, isRoadLike, occupiedTiles, roadExits } from '../map/occupancy';
import { neighbour, tileKey, type Direction } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { CommandOutcome } from '../engine/commands';
import type { Bridge, GameState } from '../engine/state';
import { waterKeys } from './waterTiles';
import { validNetworkCrossings } from '../transit/transitNetwork';
import { bridgeEnds, bridgeFootprint, bridgeRamps, bridgeTiles, isInfrastructureBridge } from './bridgeGeometry';

export { bridgeEnds, bridgeFootprint, bridgeRamps, bridgeTiles, isInfrastructureBridge };

export const BRIDGE_LENGTHS: readonly number[] = [1, 2, 3, 5];

export const BRIDGES = {
  unlockCitizens: 120,
  costs: { 1: 150, 2: 300, 3: 450, 5: 800 } as Readonly<Record<number, number>>,
  roadCosts: { 1: 300, 2: 450, 3: 600, 5: 950 } as Readonly<Record<number, number>>,
  brtCosts: { 1: 450, 2: 675, 3: 900, 5: 1425 } as Readonly<Record<number, number>>,
};

export function bridgesOf(state: GameState): readonly Bridge[] {
  return state.bridges ?? [];
}

export function waterBridgesOf(state: GameState): readonly Bridge[] {
  return bridgesOf(state).filter((bridge) => !isInfrastructureBridge(bridge));
}

export function bridgeKeys(state: GameState): Set<string> {
  return new Set(bridgesOf(state).flatMap(bridgeFootprint).map(tileKey));
}

export function bridgeCost(length: number, carrier?: Bridge['carrier']): number | undefined {
  if (carrier === 'brt') return BRIDGES.brtCosts[length];
  return carrier === 'road' ? BRIDGES.roadCosts[length] : BRIDGES.costs[length];
}

const ACROSS: Record<Bridge['axis'], readonly Direction[]> = { x: ['N', 'S'], y: ['E', 'W'] };

function dedicatedTile(state: GameState, tile: Coord): { exits: readonly Direction[] } | undefined {
  return [...(state.brtRoads ?? []), ...(state.rails ?? [])].find((candidate) => tileKey(candidate) === tileKey(tile));
}

function infrastructureKeys(state: GameState): Set<string> {
  const onBridge = bridgeKeys(state);
  const keys = [...state.roads, ...(state.brtRoads ?? []), ...(state.rails ?? [])].map(tileKey).filter((key) => !onBridge.has(key));
  return new Set(keys);
}

function runsAlong(state: GameState, tile: Coord, axis: Bridge['axis']): boolean {
  const exits = dedicatedTile(state, tile)?.exits ?? roadExits(state, tile);
  return exits.some((direction) => !ACROSS[axis].includes(direction));
}

function placeInfrastructureBridge(state: GameState, bridge: Bridge): CommandOutcome {
  if (citizenCount(state) < BRIDGES.unlockCitizens) return { key: 'error.itemLocked' };
  const price = bridgeCost(bridge.length, bridge.carrier);
  if (price === undefined || !Number.isInteger(bridge.x) || !Number.isInteger(bridge.y) || (bridge.axis !== 'x' && bridge.axis !== 'y')) return { key: 'error.unknownCommand' };
  const footprint = bridgeFootprint(bridge);
  if (!footprint.every((tile) => isInsideOwnedParcels(state, tile))) return { key: 'error.outsideOwnedParcels' };
  const occupied = occupiedTiles(state);
  const beneath = infrastructureKeys(state);
  const span = bridgeTiles(bridge);
  const ramps = bridgeRamps(bridge);
  if (ramps.some((tile) => occupied.has(tileKey(tile)))) return { key: 'error.tilesOccupied' };
  if (span.some((tile) => occupied.has(tileKey(tile)) && !beneath.has(tileKey(tile)))) return { key: 'error.tilesOccupied' };
  const crossed = span.filter((tile) => beneath.has(tileKey(tile)));
  if (crossed.length === 0) return { key: 'error.bridgeNeedsInfrastructure' };
  if (crossed.some((tile) => runsAlong(state, tile, bridge.axis))) return { key: 'error.bridgeCrossesAlong' };
  return bridge.carrier === 'brt' ? placeBrtBridge(state, bridge, price) : placeRoadBridge(state, bridge, price);
}

function placeRoadBridge(state: GameState, bridge: Bridge, price: number): CommandOutcome {
  if (joinsRamp(state, bridge)) return { key: 'error.tilesOccupied' };
  if (!bridgeEnds(bridge).every((end) => isRoadLike(state, end))) return { key: 'error.bridgeNeedsRoad' };
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  return {
    state: {
      ...state,
      urbs: state.urbs - price,
      bridges: [...bridgesOf(state), bridge],
      roads: [...state.roads, ...bridgeRamps(bridge).map((tile) => ({ ...tile, kind: 'road' as const }))],
    },
    events: [],
  };
}

const TOWARD: Record<Bridge['axis'], readonly [Direction, Direction]> = { x: ['E', 'W'], y: ['S', 'N'] };

function placeBrtBridge(state: GameState, bridge: Bridge, price: number): CommandOutcome {
  const brt = state.brtRoads ?? [];
  const [startEnd, finishEnd] = bridgeEnds(bridge);
  const [forward, back] = TOWARD[bridge.axis];
  const ends = [{ tile: startEnd, toward: forward }, { tile: finishEnd, toward: back }];
  if (!ends.every(({ tile }) => brt.some((candidate) => tileKey(candidate) === tileKey(tile)))) return { key: 'error.bridgeNeedsBrt' };
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  const [firstRamp, lastRamp] = bridgeRamps(bridge);
  const ramps = [
    { ...firstRamp!, exits: [back] },
    { ...lastRamp!, exits: [forward] },
  ];
  const widened = brt.map((candidate) => {
    const end = ends.find((entry) => tileKey(entry.tile) === tileKey(candidate));
    return end && !candidate.exits.includes(end.toward) ? { ...candidate, exits: [...candidate.exits, end.toward] } : candidate;
  });
  const next: GameState = { ...state, urbs: state.urbs - price, bridges: [...bridgesOf(state), bridge], brtRoads: [...widened, ...ramps] };
  if (!validNetworkCrossings(next)) return { key: 'error.invalidCrossing' };
  return { state: next, events: [] };
}

function joinsRamp(state: GameState, bridge: Bridge): boolean {
  const [from, to] = [bridgeTiles(bridge)[0]!, bridgeTiles(bridge)[bridge.length - 1]!];
  const [firstRamp, lastRamp] = bridgeRamps(bridge);
  const lateral = [firstRamp!, lastRamp!].flatMap((ramp) => ACROSS[bridge.axis].map((direction) => neighbour(ramp, direction)));
  return [from, to, ...lateral].some((tile) => isRoadLike(state, tile));
}

export function placeBridge(state: GameState, bridge: Bridge): CommandOutcome {
  if (isInfrastructureBridge(bridge)) return placeInfrastructureBridge(state, bridge);
  if (citizenCount(state) < BRIDGES.unlockCitizens) return { key: 'error.itemLocked' };
  const price = bridgeCost(bridge.length);
  if (price === undefined || !Number.isInteger(bridge.x) || !Number.isInteger(bridge.y) || (bridge.axis !== 'x' && bridge.axis !== 'y')) return { key: 'error.unknownCommand' };
  const tiles = bridgeTiles(bridge);
  if (!tiles.every((tile) => isInsideOwnedParcels(state, tile))) return { key: 'error.outsideOwnedParcels' };
  const water = waterKeys(state);
  if (!tiles.every((tile) => water.has(tileKey(tile)))) return { key: 'error.bridgeNeedsWater' };
  const taken = new Set([...bridgeKeys(state), ...(state.boats ?? []).map(tileKey)]);
  if (tiles.some((tile) => taken.has(tileKey(tile)))) return { key: 'error.tilesOccupied' };
  if (!bridgeEnds(bridge).every((end) => isRoadLike(state, end))) return { key: 'error.bridgeNeedsRoad' };
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  return {
    state: {
      ...state,
      urbs: state.urbs - price,
      bridges: [...bridgesOf(state), bridge],
      roads: [...state.roads, ...tiles.map((tile) => ({ ...tile, kind: 'road' as const }))],
    },
    events: [],
  };
}

export function bridgeAt(state: GameState, tile: Coord): Bridge | undefined {
  return bridgesOf(state).find((bridge) => bridgeFootprint(bridge).some((candidate) => tileKey(candidate) === tileKey(tile)));
}

export function withoutBridge(state: GameState, bridge: Bridge): GameState {
  const covered = new Set((isInfrastructureBridge(bridge) ? bridgeRamps(bridge) : bridgeTiles(bridge)).map(tileKey));
  if (bridge.carrier === 'brt') return withoutBrtBridge(state, bridge, covered);
  return {
    ...state,
    bridges: bridgesOf(state).filter((candidate) => candidate !== bridge),
    roads: state.roads.filter((road) => !covered.has(tileKey(road))),
  };
}

export function refundOf(bridge: Bridge): number {
  return Math.floor((bridgeCost(bridge.length, bridge.carrier) ?? 0) * GAME_CONFIG.sellRefundRatio);
}

function withoutBrtBridge(state: GameState, bridge: Bridge, ramps: ReadonlySet<string>): GameState {
  const [startEnd, finishEnd] = bridgeEnds(bridge);
  const [forward, back] = TOWARD[bridge.axis];
  const released = new Map([[tileKey(startEnd), forward], [tileKey(finishEnd), back]]);
  const brtRoads = (state.brtRoads ?? [])
    .filter((tile) => !ramps.has(tileKey(tile)))
    .map((tile) => {
      const exit = released.get(tileKey(tile));
      return exit ? { ...tile, exits: tile.exits.filter((direction) => direction !== exit) } : tile;
    });
  return { ...state, bridges: bridgesOf(state).filter((candidate) => candidate !== bridge), brtRoads };
}
