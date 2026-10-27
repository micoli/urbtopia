import { citizenCount } from '../environment/ecology';
import { GAME_CONFIG } from '../engine/config';
import { isInsideOwnedParcels, isRoadLike, occupiedTiles, roadExits } from '../map/occupancy';
import { neighbour, tileKey, type Direction } from '../map/geometry';
import type { Coord } from '../map/coord';
import type { CommandOutcome } from '../engine/commands';
import type { Bridge, GameState } from '../engine/state';
import { waterKeys } from './waterTiles';
import { roadTierOf, roadTierUpgradeCost } from '../traffic/roadTier';
import { validNetworkCrossings } from '../transit/transitNetwork';
import { footbridgeEndLinks } from '../map/footbridgeAccess';
import { bridgeDeck, bridgeEnds, bridgeFootprint, bridgeRamps, bridgeTiles, isInfrastructureBridge, isPedestrianBridge } from './bridgeGeometry';
import { footbridgeParts } from './footbridgeGeometry';

export { bridgeDeck, bridgeEnds, bridgeFootprint, bridgeRamps, bridgeTiles, footbridgeParts, isInfrastructureBridge, isPedestrianBridge };

export const BRIDGE_LENGTHS: readonly number[] = [1, 2, 3, 5];

export const BRIDGES = {
  unlockCitizens: 120,
  costs: { 1: 150, 2: 300, 3: 450, 5: 800 } as Readonly<Record<number, number>>,
  roadCosts: { 1: 300, 2: 450, 3: 600, 5: 950 } as Readonly<Record<number, number>>,
  brtCosts: { 1: 450, 2: 675, 3: 900, 5: 1425 } as Readonly<Record<number, number>>,
  footCosts: { 1: 180, 2: 270, 3: 360, 5: 570 } as Readonly<Record<number, number>>,
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
  if (carrier === 'pedestrian') return BRIDGES.footCosts[length];
  return carrier === 'road' ? BRIDGES.roadCosts[length] : BRIDGES.costs[length];
}

const ACROSS: Record<Bridge['axis'], readonly Direction[]> = { x: ['N', 'S'], y: ['E', 'W'] };

function dedicatedTile(state: GameState, tile: Coord): { exits: readonly Direction[] } | undefined {
  return [...(state.brtRoads ?? []), ...(state.rails ?? [])].find((candidate) => tileKey(candidate) === tileKey(tile));
}

export function bridgeRoadKeys(state: GameState): Set<string> {
  return new Set(bridgesOf(state).flatMap((bridge) => (isInfrastructureBridge(bridge) ? bridgeRamps(bridge) : bridgeTiles(bridge))).map(tileKey));
}

function infrastructureKeys(state: GameState): Set<string> {
  const onBridge = bridgeRoadKeys(state);
  const keys = [...state.roads, ...(state.brtRoads ?? []), ...(state.rails ?? [])].map(tileKey).filter((key) => !onBridge.has(key));
  return new Set(keys);
}

function runsAlong(state: GameState, tile: Coord, axis: Bridge['axis']): boolean {
  const exits = dedicatedTile(state, tile)?.exits ?? roadExits(state, tile);
  return exits.some((direction) => !ACROSS[axis].includes(direction));
}

function placeInfrastructureBridge(state: GameState, bridge: Bridge): CommandOutcome {
  if (isPedestrianBridge(bridge)) return placeFootbridge(state, bridge);
  if (citizenCount(state) < BRIDGES.unlockCitizens) return { key: 'error.itemLocked' };
  const price = bridgeCost(bridge.length, bridge.carrier);
  if (price === undefined || !Number.isInteger(bridge.x) || !Number.isInteger(bridge.y) || (bridge.axis !== 'x' && bridge.axis !== 'y')) return { key: 'error.unknownCommand' };
  const footprint = bridgeFootprint(bridge);
  if (!footprint.every((tile) => isInsideOwnedParcels(state, tile))) return { key: 'error.outsideOwnedParcels' };
  const occupied = occupiedTiles(state);
  const beneath = infrastructureKeys(state);
  const taken = bridgeKeys(state);
  if (footprint.some((tile) => taken.has(tileKey(tile)))) return { key: 'error.tilesOccupied' };
  const span = bridgeTiles(bridge);
  const ramps = bridgeRamps(bridge);
  if (ramps.some((tile) => occupied.has(tileKey(tile)))) return { key: 'error.tilesOccupied' };
  if (span.some((tile) => occupied.has(tileKey(tile)) && !beneath.has(tileKey(tile)))) return { key: 'error.tilesOccupied' };
  const crossed = span.filter((tile) => beneath.has(tileKey(tile)));
  if (crossed.length === 0) return { key: 'error.bridgeNeedsInfrastructure' };
  if (crossed.some((tile) => runsAlong(state, tile, bridge.axis))) return { key: 'error.bridgeCrossesAlong' };
  return bridge.carrier === 'brt' ? placeBrtBridge(state, bridge, price) : placeRoadBridge(state, bridge, price);
}

function placeFootbridge(state: GameState, bridge: Bridge): CommandOutcome {
  if (citizenCount(state) < BRIDGES.unlockCitizens) return { key: 'error.itemLocked' };
  const price = bridgeCost(bridge.length, 'pedestrian');
  if (price === undefined || !Number.isInteger(bridge.x) || !Number.isInteger(bridge.y) || (bridge.axis !== 'x' && bridge.axis !== 'y') || (bridge.side !== 1 && bridge.side !== -1)) return { key: 'error.unknownCommand' };
  const footprint = bridgeFootprint(bridge);
  if (!footprint.every((tile) => isInsideOwnedParcels(state, tile))) return { key: 'error.outsideOwnedParcels' };
  const occupied = occupiedTiles(state);
  const beneath = infrastructureKeys(state);
  const taken = bridgeKeys(state);
  if (footprint.some((tile) => taken.has(tileKey(tile)))) return { key: 'error.tilesOccupied' };
  const { stairs, corridors } = footbridgeParts(bridge);
  if ([...stairs, ...corridors].some((tile) => occupied.has(tileKey(tile)))) return { key: 'error.tilesOccupied' };
  const passedOver = bridgeTiles(bridge);
  if (passedOver.some((tile) => occupied.has(tileKey(tile)) && !beneath.has(tileKey(tile)))) return { key: 'error.tilesOccupied' };
  if (!bridgeDeck(bridge).some((tile) => beneath.has(tileKey(tile)))) return { key: 'error.bridgeNeedsInfrastructure' };
  if (passedOver.some((tile) => beneath.has(tileKey(tile)) && runsAlong(state, tile, bridge.axis))) return { key: 'error.bridgeCrossesAlong' };
  if (footbridgeEndLinks(state, bridge).some((links) => links.length === 0)) return { key: 'error.bridgeNeedsPath' };
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  return { state: { ...state, urbs: state.urbs - price, bridges: [...bridgesOf(state), { x: bridge.x, y: bridge.y, length: bridge.length, axis: bridge.axis, carrier: 'pedestrian', side: bridge.side }] }, events: [] };
}

function placeRoadBridge(state: GameState, bridge: Bridge, price: number): CommandOutcome {
  if (joinsRamp(state, bridge)) return { key: 'error.tilesOccupied' };
  if (!bridgeEnds(bridge).every((end) => isRoadLike(state, end))) return { key: 'error.bridgeNeedsRoad' };
  if (state.urbs < price) return { key: 'error.notEnoughUrbs' };
  const tier = Math.min(...bridgeEnds(bridge).map((end) => roadTierOf(state, end)));
  const tiered = tier > 1 ? { tier } : {};
  return {
    state: {
      ...state,
      urbs: state.urbs - price,
      bridges: [...bridgesOf(state), { ...bridge, ...tiered }],
      roads: [...state.roads, ...bridgeRamps(bridge).map((tile) => ({ ...tile, kind: 'road' as const, ...tiered }))],
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
  const [firstRamp, lastRamp] = bridgeRamps(bridge);
  const lateral = [firstRamp!, lastRamp!].flatMap((ramp) => ACROSS[bridge.axis].map((direction) => neighbour(ramp, direction)));
  return lateral.some((tile) => isRoadLike(state, tile));
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

// Moving or turning a Bridge over infrastructure is free: it is lifted and placed again with its own length, Carrier and tier.
export function moveBridge(state: GameState, from: Coord, target: Pick<Bridge, 'x' | 'y' | 'axis' | 'side'>): CommandOutcome {
  const bridge = bridgeAt(state, from);
  if (!bridge) return { key: 'error.noBridgeHere' };
  if (!isInfrastructureBridge(bridge)) return { key: 'error.bridgeNotMovable' };
  const moved: Bridge = { x: target.x, y: target.y, length: bridge.length, axis: target.axis, carrier: bridge.carrier!, ...(isPedestrianBridge(bridge) ? { side: target.side } : {}) };
  const placed = placeBridge({ ...withoutBridge(state, bridge), urbs: Number.MAX_SAFE_INTEGER }, moved);
  if (!('state' in placed)) return placed;
  const tier = bridge.tier;
  const bridges = placed.state.bridges!.map((candidate) => (candidate.x === moved.x && candidate.y === moved.y && candidate.axis === moved.axis && tier !== undefined ? { ...candidate, tier } : candidate));
  const ramps = new Set(bridgeRamps(moved).map(tileKey));
  const roads = tier === undefined ? placed.state.roads : placed.state.roads.map((road) => (ramps.has(tileKey(road)) ? { ...road, tier } : road));
  return { state: { ...placed.state, urbs: state.urbs, bridges, roads }, events: [] };
}

export function bridgeAt(state: GameState, tile: Coord): Bridge | undefined {
  return bridgesOf(state).find((bridge) => bridgeFootprint(bridge).some((candidate) => tileKey(candidate) === tileKey(tile)));
}

export function withoutBridge(state: GameState, bridge: Bridge): GameState {
  if (isPedestrianBridge(bridge)) return { ...state, bridges: bridgesOf(state).filter((candidate) => candidate !== bridge) };
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

export function roadBridgesAt(state: GameState, targets: ReadonlySet<string>): Bridge[] {
  return bridgesOf(state).filter((bridge) => bridge.carrier === 'road' && bridgeFootprint(bridge).some((tile) => targets.has(tileKey(tile))));
}

export function bridgeUpgradeCost(bridge: Bridge): number {
  return bridgeFootprint(bridge).length * (roadTierUpgradeCost(bridge.tier ?? 1) ?? 0);
}

export function upgradedBridges(state: GameState, bridges: readonly Bridge[]): { bridges: Map<Bridge, Bridge>; ramps: Map<string, GameState['roads'][number]> } {
  const result = { bridges: new Map<Bridge, Bridge>(), ramps: new Map<string, GameState['roads'][number]>() };
  for (const bridge of bridges) {
    const tier = (bridge.tier ?? 1) + 1;
    result.bridges.set(bridge, { ...bridge, tier });
    for (const ramp of bridgeRamps(bridge)) {
      const road = state.roads.find((candidate) => tileKey(candidate) === tileKey(ramp));
      if (road) result.ramps.set(tileKey(ramp), { ...road, tier });
    }
  }
  return result;
}

export function spanKeys(state: GameState): Set<string> {
  return new Set(bridgesOf(state).filter(isInfrastructureBridge).flatMap(bridgeTiles).map(tileKey));
}

export function bridgeClearanceFailure(state: GameState): 'error.bridgeCrossesAlong' | 'error.tilesOccupied' | null {
  for (const bridge of bridgesOf(state).filter(isInfrastructureBridge)) {
    const span = bridgeTiles(bridge);
    if (span.some((tile) => runsAlongAnything(state, tile, bridge.axis))) return 'error.bridgeCrossesAlong';
    if (bridge.carrier === 'road' && joinsRamp(state, bridge)) return 'error.tilesOccupied';
  }
  return null;
}

function runsAlongAnything(state: GameState, tile: Coord, axis: Bridge['axis']): boolean {
  const key = tileKey(tile);
  const onBridge = bridgeRoadKeys(state);
  const lower = [...state.roads, ...(state.brtRoads ?? []), ...(state.rails ?? [])].some((candidate) => tileKey(candidate) === key) && !onBridge.has(key);
  return lower && runsAlong(state, tile, axis);
}

export function bridgeLosesCrossing(state: GameState): boolean {
  const beneath = infrastructureKeys(state);
  return bridgesOf(state).filter(isInfrastructureBridge).some((bridge) => !bridgeDeck(bridge).some((tile) => beneath.has(tileKey(tile))));
}
