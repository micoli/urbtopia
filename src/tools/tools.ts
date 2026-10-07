import {
  extendNetwork,
  BUILDING_SPECS,
  GAME_CONFIG,
  buyableParcels,
  parcelPrice,
  autoRotation,
  dispatch,
  FACILITIES,
  footprintOf,
  footprintTiles,
  isFacilityType,
  isWithinReach,
  previewFacilityCoverage,
  frontDirection,
  placementCost,
  roadBuildCost,
  roadPath,
  roundaboutTiles,
  type Building,
  type BuildingType,
  casinoRadius,
  SPORT_VENUES,
  isSportVenueType,
  type Command,
  type Coord,
  type Direction,
  type CropId,
  type ErrorKey,
  type FacilityType,
  type GameState,
  type HomeColorVariant,
  type Rotation,
} from '../core';

export type Tool =
  | { kind: 'building'; buildingType: BuildingType; solar?: boolean; colorVariant?: HomeColorVariant }
  | { kind: 'move'; buildingId: number }
  | { kind: 'road'; mode?: 'brt' | 'rail'; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'crossing' }
  | { kind: 'roundabout' }
  | { kind: 'demolishRoad'; mode?: 'brt' | 'rail'; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'upgradeRoad'; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'parcel' }
  | { kind: 'brush'; action: BrushAction; crop?: CropId; tiles: Coord[] };

export type PathTool = Extract<Tool, { kind: 'road' | 'demolishRoad' | 'upgradeRoad' }>;

export function isPathTool(tool: Tool | null): tool is PathTool {
  return tool?.kind === 'road' || tool?.kind === 'demolishRoad' || tool?.kind === 'upgradeRoad';
}

export type BrushAction = 'layField' | 'removeField' | 'plant';

export interface ToolContext {
  state: GameState;
  tile: Coord;
  rotation: Rotation | null;
}

export interface GhostRect {
  x: number;
  y: number;
  width: number;
  depth: number;
  tone: 'target' | 'hint';
}

export interface GhostSpec {
  tiles: Coord[];
  rects: GhostRect[];
  valid: boolean;
  front: { x: number; z: number; direction: Direction } | null;
  range?: Coord[];
}

export interface Evaluation {
  ghost: GhostSpec;
  valid: boolean;
  issue: ErrorKey | null;
  command: Command | null;
  cost: number | null;
  rotation: Rotation | null;
  coverage?: { cityWide: boolean; homes: number };
}

export interface Confirmation {
  command: Command | null;
  nextTool: Tool | null;
}

function dryRun(state: GameState, command: Command): ErrorKey | null {
  const result = dispatch(state, command, state.lastSeen);
  return result.ok ? null : result.error.key;
}

function evaluation(tiles: Coord[], command: Command | null, state: GameState, extra: Partial<Evaluation> = {}): Evaluation {
  const issue = command ? dryRun(state, command) : null;
  const valid = command !== null && issue === null;
  return {
    ghost: { tiles, rects: [], valid, front: null },
    valid,
    issue,
    command,
    cost: null,
    rotation: null,
    ...extra,
  };
}

function frontMarker(type: BuildingType, tile: Coord, rotation: Rotation, tier: number): GhostSpec['front'] {
  const { width, depth } = footprintOf(type, rotation, tier);
  const direction = frontDirection(rotation);
  const centerX = tile.x + width / 2;
  const centerZ = tile.y + depth / 2;
  const reach: Record<Direction, { x: number; z: number }> = {
    N: { x: 0, z: -depth / 2 },
    S: { x: 0, z: depth / 2 },
    W: { x: -width / 2, z: 0 },
    E: { x: width / 2, z: 0 },
  };
  return { x: centerX + reach[direction].x, z: centerZ + reach[direction].z, direction };
}

const SELECTION_MARGIN = 0.3;

export function selectionGhost(state: GameState, buildingId: number | null, showReach = true): GhostSpec | null {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return null;
  const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
  const rect: GhostRect = { x: building.x - SELECTION_MARGIN, y: building.y - SELECTION_MARGIN, width: width + 2 * SELECTION_MARGIN, depth: depth + 2 * SELECTION_MARGIN, tone: 'target' };
  const range = showReach ? reachTilesOf(building) : [];
  return { tiles: [], rects: [rect], valid: true, front: null, ...(range.length ? { range } : {}) };
}

export function evaluateTool(tool: Tool, { state, tile, rotation }: ToolContext): Evaluation {
  switch (tool.kind) {
    case 'building':
      return evaluateBuilding(state, tool.buildingType, tile, rotation, { type: 'PlaceBuilding', buildingType: tool.buildingType, solar: tool.solar, colorVariant: tool.colorVariant }, placementCost(tool.buildingType) + (tool.solar ? 180 : 0));
    case 'move': {
      const building = state.buildings.find((candidate) => candidate.id === tool.buildingId);
      if (!building) return evaluation([tile], null, state);
      return evaluateBuilding(state, building.type, tile, rotation, { type: 'MoveBuilding', id: building.id }, 0, building.tier);
    }
    case 'road':
      return evaluateRoad(state, tool, tile);
    case 'crossing':
      return evaluation([tile], { type: 'PlaceCrossing', x: tile.x, y: tile.y }, state);
    case 'roundabout':
      return evaluation(roundaboutTiles(tile), { type: 'PlaceRoundabout', x: tile.x, y: tile.y }, state);
    case 'demolishRoad':
      return evaluateDemolishRoad(state, tool, tile);
    case 'upgradeRoad':
      return evaluateUpgradeRoad(state, tool, tile);
    case 'parcel':
      return evaluateParcel(state, tile);
    case 'brush':
      return evaluateBrush(state, tool, tile);
  }
}

function evaluateBuilding(
  state: GameState,
  type: BuildingType,
  tile: Coord,
  requestedRotation: Rotation | null,
  base: { type: 'PlaceBuilding'; buildingType: BuildingType; solar?: boolean; colorVariant?: HomeColorVariant } | { type: 'MoveBuilding'; id: number },
  cost: number,
  tier = 1,
): Evaluation {
  const reference =
    base.type === 'MoveBuilding' ? { ...state, buildings: state.buildings.filter((building) => building.id !== base.id) } : state;
  const rotation = requestedRotation ?? autoRotation(reference, type, tile.x, tile.y, tier);
  const command: Command = { ...base, x: tile.x, y: tile.y, rotation };
  const tiles = footprintTiles({ type, x: tile.x, y: tile.y, rotation, tier });
  const result = evaluation(tiles, command, state, { cost, rotation });
  if (BUILDING_SPECS[type].requiresRoad) result.ghost.front = frontMarker(type, tile, rotation, tier);
  if (isFacilityType(type)) addCoveragePreview(result, reference, type, tile, rotation);
  return result;
}

function addCoveragePreview(result: Evaluation, state: GameState, type: FacilityType, tile: Coord, rotation: Rotation): void {
  const { radius } = FACILITIES[type];
  const covered = previewFacilityCoverage(state, type, tile.x, tile.y, rotation);
  result.coverage = { cityWide: radius === null, homes: covered.length };
  result.ghost.rects = covered.map((home) => {
    const { width, depth } = footprintOf(home.type, home.rotation, home.tier);
    return { x: home.x, y: home.y, width, depth, tone: 'hint' as const };
  });
  if (radius === null) return;
  result.ghost.range = rangeTiles(type, radius, tile, rotation);
}

function reachTilesOf(building: Building): Coord[] {
  if (building.type === 'casino') return rangeTiles(building.type, casinoRadius(building.tier), building, building.rotation, building.tier);
  if (isSportVenueType(building.type)) return rangeTiles(building.type, SPORT_VENUES[building.type].radius, building, building.rotation);
  if (!isFacilityType(building.type)) return [];
  return rangeTiles(building.type, FACILITIES[building.type].radius, building, building.rotation);
}

function rangeTiles(type: BuildingType, radius: number | null, tile: Coord, rotation: Rotation, tier = 1): Coord[] {
  if (radius === null) return [];
  const { width, depth } = footprintOf(type, rotation, tier);
  const center = { x: tile.x + width / 2, y: tile.y + depth / 2 };
  const reach = Math.ceil(radius);
  const range: Coord[] = [];
  for (let dy = -reach - depth; dy <= reach + depth; dy++) {
    for (let dx = -reach - width; dx <= reach + width; dx++) {
      const candidate = { x: Math.floor(center.x) + dx, y: Math.floor(center.y) + dy };
      if (isWithinReach(candidate.x + 0.5 - center.x, candidate.y + 0.5 - center.y, radius)) range.push(candidate);
    }
  }
  return range;
}

function brushCommand(tool: Extract<Tool, { kind: 'brush' }>, tiles: Coord[]): Command | null {
  switch (tool.action) {
    case 'layField':
      return { type: 'LayFields', tiles };
    case 'removeField':
      return { type: 'RemoveFields', tiles };
    case 'plant':
      return tool.crop ? { type: 'Plant', crop: tool.crop, tiles } : null;
  }
}

function evaluateBrush(state: GameState, tool: Extract<Tool, { kind: 'brush' }>, hovered: Coord): Evaluation {
  const tiles = tool.tiles.length > 0 ? tool.tiles : [hovered];
  const command = brushCommand(tool, tiles);
  const result = evaluation(tiles, command, state);
  if (!command || !result.valid) return result;
  const outcome = dispatch(state, command, state.lastSeen);
  return { ...result, cost: outcome.ok ? Math.max(0, state.urbs - outcome.state.urbs) : null };
}

export function extendBrush(tool: Tool, tile: Coord): Tool {
  if (tool.kind !== 'brush') return tool;
  const last = tool.tiles.at(-1);
  const path = last ? lineBetween(last, tile) : [tile];
  const known = new Set(tool.tiles.map((t) => `${t.x},${t.y}`));
  const added = path.filter((t) => !known.has(`${t.x},${t.y}`));
  return added.length === 0 ? tool : { ...tool, tiles: [...tool.tiles, ...added] };
}

function lineBetween(from: Coord, to: Coord): Coord[] {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  if (steps === 0) return [to];
  return Array.from({ length: steps }, (_, index) => {
    const ratio = (index + 1) / steps;
    return { x: Math.round(from.x + (to.x - from.x) * ratio), y: Math.round(from.y + (to.y - from.y) * ratio) };
  });
}

function evaluateParcel(state: GameState, tile: Coord): Evaluation {
  const size = GAME_CONFIG.parcelSizeInTiles;
  const parcel = { x: Math.floor(tile.x / size), y: Math.floor(tile.y / size) };
  const result = evaluation([], { type: 'BuyParcel', x: parcel.x, y: parcel.y }, state, { cost: parcelPrice(state) });
  const hints = buyableParcels(state).map((candidate) => ({ x: candidate.x * size, y: candidate.y * size, width: size, depth: size, tone: 'hint' as const }));
  result.ghost.rects = [...hints, { x: parcel.x * size, y: parcel.y * size, width: size, depth: size, tone: 'target' }];
  return result;
}

function evaluateRoad(state: GameState, tool: Extract<Tool, { kind: 'road' }>, tile: Coord): Evaluation {
  if (!tool.start) {
    return { ghost: { tiles: [tile], rects: [], valid: true, front: null }, valid: true, issue: null, command: null, cost: null, rotation: null };
  }
  const path = roadPath(tool.start, tile, tool.horizontalFirst);
  if (tool.mode) {
    const result = extendNetwork(state, tool.mode, tool.start, tile, tool.horizontalFirst);
    return evaluation(path, { type: 'BuildTransit', mode: tool.mode, from: tool.start, to: tile, horizontalFirst: tool.horizontalFirst }, state, { cost: 'cost' in result ? result.cost : null });
  }
  const command: Command = { type: 'BuildRoad', from: tool.start, to: tile, horizontalFirst: tool.horizontalFirst };
  return evaluation(path, command, state, { cost: roadBuildCost(state, path) });
}

function evaluateDemolishRoad(state: GameState, tool: Extract<Tool, { kind: 'demolishRoad' }>, tile: Coord): Evaluation {
  if (!tool.start) return evaluation([tile], null, state);
  const path = roadPath(tool.start, tile, tool.horizontalFirst);
  if (tool.mode) return evaluation(path, { type: 'DemolishTransit', mode: tool.mode, from: tool.start, to: tile, horizontalFirst: tool.horizontalFirst }, state);
  return evaluation(path, { type: 'DemolishRoadPath', from: tool.start, to: tile, horizontalFirst: tool.horizontalFirst }, state);
}

function evaluateUpgradeRoad(state: GameState, tool: Extract<Tool, { kind: 'upgradeRoad' }>, tile: Coord): Evaluation {
  if (!tool.start) return evaluation([tile], null, state);
  const path = roadPath(tool.start, tile, tool.horizontalFirst);
  const command: Command = { type: 'UpgradeRoads', tiles: path };
  const result = evaluation(path, command, state);
  if (!result.valid) return result;
  const outcome = dispatch(state, command, state.lastSeen);
  return { ...result, cost: outcome.ok ? Math.max(0, state.urbs - outcome.state.urbs) : null };
}

export function confirmTool(tool: Tool, tile: Coord, current: Evaluation, keepTool = false): Confirmation {
  if (tool.kind === 'brush') return { command: current.valid ? current.command : null, nextTool: { ...tool, tiles: [] } };
  const pathTool = isPathTool(tool);
  if (pathTool && !tool.start) return { command: null, nextTool: { ...tool, start: tile } };
  if (!current.valid) return { command: null, nextTool: tool };
  if (pathTool) return { command: current.command, nextTool: { ...tool, start: null } };
  if (tool.kind === 'building') return { command: current.command, nextTool: keepTool ? tool : null };
  if (tool.kind === 'move') return { command: current.command, nextTool: null };
  return { command: current.command, nextTool: tool };
}
