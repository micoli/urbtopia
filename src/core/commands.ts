import { BUILDING_SPECS, placementCost } from './buildingSpecs';
import { GAME_CONFIG } from './config';
import type { Coord } from './coord';
import type { GameEvent } from './events';
import { tileKey } from './geometry';
import { isInsideOwnedParcels, occupiedTiles, roadExits, roundaboutTiles } from './occupancy';
import { autoRotation, frontTouchesRoad, placementIssue } from './placement';
import { roadPath } from './roads';
import type { Building, BuildingType, GameState, Rotation } from './state';

export type Command =
  | { readonly type: 'BuildRoad'; readonly from: Coord; readonly to: Coord; readonly horizontalFirst?: boolean }
  | { readonly type: 'PlaceCrossing'; readonly x: number; readonly y: number }
  | { readonly type: 'PlaceRoundabout'; readonly x: number; readonly y: number }
  | { readonly type: 'DemolishRoad'; readonly x: number; readonly y: number }
  | { readonly type: 'PlaceBuilding'; readonly buildingType: BuildingType; readonly x: number; readonly y: number; readonly rotation?: Rotation }
  | { readonly type: 'SellBuilding'; readonly id: number }
  | { readonly type: 'MoveBuilding'; readonly id: number; readonly x: number; readonly y: number; readonly rotation?: Rotation };

export type ErrorKey =
  | 'error.unknownCommand'
  | 'error.unknownBuilding'
  | 'error.outsideOwnedParcels'
  | 'error.tilesOccupied'
  | 'error.needsRoad'
  | 'error.storehouseExists'
  | 'error.notEnoughUrbs'
  | 'error.lastRoadOfBuilding'
  | 'error.noRoadHere'
  | 'error.invalidCrossing';

export interface CommandError {
  key: ErrorKey;
}

export type CommandOutcome = { state: GameState; events: GameEvent[] } | CommandError;

export function isError(outcome: CommandOutcome): outcome is CommandError {
  return 'key' in outcome;
}

const fail = (key: ErrorKey): CommandError => ({ key });

export function handleCommand(state: GameState, command: Command): CommandOutcome {
  switch (command.type) {
    case 'BuildRoad':
      return buildRoad(state, command.from, command.to, command.horizontalFirst ?? true);
    case 'PlaceCrossing':
      return placeCrossing(state, { x: command.x, y: command.y });
    case 'PlaceRoundabout':
      return placeRoundabout(state, { x: command.x, y: command.y });
    case 'DemolishRoad':
      return demolishRoad(state, { x: command.x, y: command.y });
    case 'PlaceBuilding':
      return placeBuilding(state, command.buildingType, command.x, command.y, command.rotation);
    case 'SellBuilding':
      return sellBuilding(state, command.id);
    case 'MoveBuilding':
      return moveBuilding(state, command.id, command.x, command.y, command.rotation);
    default:
      return fail('error.unknownCommand');
  }
}

function buildRoad(state: GameState, from: Coord, to: Coord, horizontalFirst: boolean): CommandOutcome {
  const path = roadPath(from, to, horizontalFirst);
  if (!path.every((tile) => isInsideOwnedParcels(state, tile))) return fail('error.outsideOwnedParcels');
  const roadKeys = new Set(state.roads.map(tileKey));
  const blocked = occupiedTiles(state);
  const missing = path.filter((tile) => !roadKeys.has(tileKey(tile)));
  if (missing.some((tile) => blocked.has(tileKey(tile)))) return fail('error.tilesOccupied');
  const cost = missing.length * GAME_CONFIG.roadCostPerTile;
  if (state.urbs < cost) return fail('error.notEnoughUrbs');
  return {
    state: { ...state, urbs: state.urbs - cost, roads: [...state.roads, ...missing.map((tile) => ({ ...tile, kind: 'road' as const }))] },
    events: [{ type: 'RoadBuilt', tiles: missing.length }],
  };
}

function placeCrossing(state: GameState, tile: Coord): CommandOutcome {
  const road = state.roads.find((candidate) => candidate.x === tile.x && candidate.y === tile.y);
  if (!road) return fail('error.noRoadHere');
  const exits = roadExits(state, tile);
  const isStraight = exits.length === 2 && ((exits.includes('E') && exits.includes('W')) || (exits.includes('N') && exits.includes('S')));
  if (road.kind === 'crossing' || !isStraight) return fail('error.invalidCrossing');
  if (state.urbs < GAME_CONFIG.crossingCost) return fail('error.notEnoughUrbs');
  return {
    state: {
      ...state,
      urbs: state.urbs - GAME_CONFIG.crossingCost,
      roads: state.roads.map((candidate) => (candidate === road ? { ...candidate, kind: 'crossing' as const } : candidate)),
    },
    events: [],
  };
}

function placeRoundabout(state: GameState, center: Coord): CommandOutcome {
  const tiles = roundaboutTiles(center);
  if (!tiles.every((tile) => isInsideOwnedParcels(state, tile))) return fail('error.outsideOwnedParcels');
  const occupied = occupiedTiles(state);
  if (tiles.some((tile) => occupied.has(tileKey(tile)))) return fail('error.tilesOccupied');
  if (state.urbs < GAME_CONFIG.roundaboutCost) return fail('error.notEnoughUrbs');
  return {
    state: { ...state, urbs: state.urbs - GAME_CONFIG.roundaboutCost, roundabouts: [...state.roundabouts, center] },
    events: [],
  };
}

function demolishRoad(state: GameState, tile: Coord): CommandOutcome {
  const roundabout = state.roundabouts.find((center) => roundaboutTiles(center).some((t) => t.x === tile.x && t.y === tile.y));
  const road = state.roads.find((candidate) => candidate.x === tile.x && candidate.y === tile.y);
  if (!road && !roundabout) return fail('error.noRoadHere');
  const next: GameState = {
    ...state,
    roads: road ? state.roads.filter((candidate) => candidate !== road) : state.roads,
    roundabouts: !road && roundabout ? state.roundabouts.filter((center) => center !== roundabout) : state.roundabouts,
  };
  const orphaned = next.buildings.some(
    (building) => BUILDING_SPECS[building.type].requiresRoad && !frontTouchesRoad(next, building.type, building.x, building.y, building.rotation),
  );
  if (orphaned) return fail('error.lastRoadOfBuilding');
  return { state: next, events: [] };
}

function placeBuilding(state: GameState, type: BuildingType, x: number, y: number, requestedRotation?: Rotation): CommandOutcome {
  const rotation = requestedRotation ?? autoRotation(state, type, x, y);
  const issue = placementIssue(state, type, x, y, rotation);
  if (issue) return fail(issue);
  const building: Building = { id: state.nextId, type, x, y, rotation };
  return {
    state: { ...state, urbs: state.urbs - placementCost(type), nextId: state.nextId + 1, buildings: [...state.buildings, building] },
    events: [{ type: 'BuildingPlaced', id: building.id }],
  };
}

function sellBuilding(state: GameState, id: number): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === id);
  if (!building) return fail('error.unknownBuilding');
  const refund = Math.floor(placementCost(building.type) * GAME_CONFIG.sellRefundRatio);
  return {
    state: { ...state, urbs: state.urbs + refund, buildings: state.buildings.filter((candidate) => candidate !== building) },
    events: [{ type: 'BuildingSold', id }],
  };
}

function moveBuilding(state: GameState, id: number, x: number, y: number, requestedRotation?: Rotation): CommandOutcome {
  const building = state.buildings.find((candidate) => candidate.id === id);
  if (!building) return fail('error.unknownBuilding');
  const without: GameState = { ...state, buildings: state.buildings.filter((candidate) => candidate !== building) };
  const rotation = requestedRotation ?? autoRotation(without, building.type, x, y);
  const issue = placementIssue(without, building.type, x, y, rotation, { isMove: true });
  if (issue) return fail(issue);
  return {
    state: { ...state, buildings: state.buildings.map((candidate) => (candidate === building ? { ...building, x, y, rotation } : candidate)) },
    events: [{ type: 'BuildingMoved', id }],
  };
}
