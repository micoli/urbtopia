import {
  extendNetwork,
  BOATS,
  bridgeAt,
  bridgeCost,
  bridgeFootprint,
  isInfrastructureBridge,
  isPedestrianBridge,
  BUILDING_SPECS,
  GAME_CONFIG,
  buyableParcels,
  parcelPrice,
  autoRotation,
  fittingPlacement,
  placementIssue,
  validFronts,
  previewCommand,
  FACILITIES,
  facilityRadius,
  footprintOf,
  footprintTiles,
  frontAccessModes,
  isFacilityType,
  isWithinReach,
  previewFacilityCoverage,
  frontDirection,
  nextCopyCost,
  roadBuildCost,
  pedestrianWayBuildCost,
  walkwayBuildCost,
  pedestrianAccessRotation,
  roadPath,
  solarInstallCostOf,
  roundaboutTiles,
  stashOf,
  type BoatFamily,
  type ReplanAction,
  type TileLayer,
  type Building,
  type BuildingType,
  casinoRadius,
  SPORT_VENUES,
  WASTE_FACILITIES,
  isSportVenueType,
  greenProfileOf,
  type Command,
  type Coord,
  type Direction,
  type CropId,
  type ErrorKey,
  type Bridge,
  type FacilityType,
  type GameState,
  type ColorVariant,
  type Rotation,
  type Level,
  type NetworkMode,
  SURFACE,
} from '../core';

export type Tool =
  | { kind: 'building'; buildingType: BuildingType; solar?: boolean; colorVariant?: ColorVariant; repeat?: boolean }
  | { kind: 'move'; buildingId: number }
  | { kind: 'road'; mode?: NetworkMode; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'pedestrianWay'; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'walkway'; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'demolishWalkway'; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'pedestrianAccess' }
  | { kind: 'movePedestrianAccess'; from: Coord }
  | { kind: 'demolishPedestrianAccess' }
  | { kind: 'crossing' }
  | { kind: 'removeCrossing' }
  | { kind: 'roundabout' }
  | { kind: 'demolishRoad'; mode?: NetworkMode; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'upgradeRoad'; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'demolishPedestrianWay'; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'upgradePedestrianWay'; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'parcel' }
  | { kind: 'boat'; family: BoatFamily; marinaId: number }
  | { kind: 'bridge'; length: number; carrier?: 'road' | 'brt' | 'pedestrian' }
  | { kind: 'removeBridge' }
  | { kind: 'moveBridge'; bridge: Bridge | null }
  | { kind: 'brush'; action: BrushAction; crop?: CropId; tiles: Coord[] }
  | { kind: 'replanBuilding'; buildingType: BuildingType }
  | { kind: 'replanPath'; layer: ReplanPathLayer; tier?: number; start: Coord | null; horizontalFirst: boolean }
  | { kind: 'replanTile'; layer: 'pedestrianAccesses' | 'roundabouts' | 'roads'; crossing?: boolean }
  | { kind: 'replanBridge'; length: number; carrier?: 'road' | 'brt' | 'pedestrian' }
  | { kind: 'replanBoat'; family: BoatFamily }
  | { kind: 'replanArea'; start: Coord | null; horizontalFirst: boolean };

// The layers a Replan draws by path: a Road, a Pedestrian way, an Underground walkway, and the three networks that have their own tiles.
export type ReplanPathLayer = 'roads' | 'pedestrianWays' | 'walkways' | 'brtRoads' | 'rails' | 'tunnels';

const NETWORK_OF_LAYER: Partial<Record<ReplanPathLayer, NetworkMode>> = { brtRoads: 'brt', rails: 'rail', tunnels: 'metro' };

// The Level a tool builds on: a walkway is laid on Level -1, a Tunnel on Level -2, everything else on the Surface (a stair and a Metro station are Surface objects).
export function toolLevel(tool: Tool): Level {
  if (tool.kind === 'walkway' || tool.kind === 'demolishWalkway') return -1;
  if (tool.kind === 'replanPath') return tool.layer === 'walkways' ? -1 : tool.layer === 'tunnels' ? -2 : SURFACE;
  if ((tool.kind === 'road' || tool.kind === 'demolishRoad') && tool.mode === 'metro') return -2;
  return SURFACE;
}

export type PathTool = Extract<Tool, { kind: 'road' | 'demolishRoad' | 'upgradeRoad' | 'pedestrianWay' | 'demolishPedestrianWay' | 'upgradePedestrianWay' | 'walkway' | 'demolishWalkway' | 'replanPath' | 'replanArea' }>;

export function isPathTool(tool: Tool | null): tool is PathTool {
  return tool?.kind === 'road' || tool?.kind === 'demolishRoad' || tool?.kind === 'upgradeRoad' || tool?.kind === 'pedestrianWay' || tool?.kind === 'demolishPedestrianWay' || tool?.kind === 'upgradePedestrianWay' || tool?.kind === 'walkway' || tool?.kind === 'demolishWalkway' || tool?.kind === 'replanPath' || tool?.kind === 'replanArea';
}

export type BrushAction = 'layField' | 'removeField' | 'plant' | 'layWater' | 'removeWater' | 'replanField' | 'replanWater';

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
  front: { x: number; z: number; direction: Direction; access?: 'road' | 'brt' } | null;
  range?: Coord[];
  odorRange?: Coord[];
}

export interface Evaluation {
  ghost: GhostSpec;
  valid: boolean;
  issue: ErrorKey | null;
  command: Command | null;
  cost: number | null;
  rotation: Rotation | null;
  fronts?: Rotation[];
  coverage?: { cityWide: boolean; homes: number };
  bridge?: Bridge;
}

export interface Confirmation {
  command: Command | null;
  nextTool: Tool | null;
}

function evaluation(tiles: Coord[], command: Command | null, state: GameState, extra: Partial<Evaluation> = {}): Evaluation {
  const preview = command ? previewCommand(state, command) : null;
  const issue = preview?.error ?? null;
  const valid = command !== null && issue === null;
  return {
    ghost: { tiles, rects: [], valid, front: null },
    valid,
    issue,
    command,
    cost: preview?.cost ?? null,
    rotation: null,
    ...extra,
  };
}

function frontMarker(state: GameState, type: BuildingType, tile: Coord, rotation: Rotation, tier: number): GhostSpec['front'] {
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
  const modes = frontAccessModes(state, type, tile.x, tile.y, rotation, tier);
  const access = modes.includes('road') ? 'road' : modes.includes('brt') ? 'brt' : undefined;
  return { x: centerX + reach[direction].x, z: centerZ + reach[direction].z, direction, ...(access ? { access } : {}) };
}

const SELECTION_MARGIN = 0.3;

export interface DrawnExtent {
  width: number;
  depth: number;
  offsetX: number;
  offsetY: number;
}

const MIN_SELECTED_SIDE = 0.9;

export function selectionGhost(state: GameState, buildingId: number | null, showReach = true, drawn: DrawnExtent | null = null): GhostSpec | null {
  const building = state.buildings.find((candidate) => candidate.id === buildingId);
  if (!building) return null;
  const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
  const sideW = drawn ? Math.min(width, Math.max(drawn.width, MIN_SELECTED_SIDE)) : width;
  const sideD = drawn ? Math.min(depth, Math.max(drawn.depth, MIN_SELECTED_SIDE)) : depth;
  const centerX = building.x + width / 2 + (drawn ? Math.max(-(width - sideW) / 2, Math.min((width - sideW) / 2, drawn.offsetX)) : 0);
  const centerY = building.y + depth / 2 + (drawn ? Math.max(-(depth - sideD) / 2, Math.min((depth - sideD) / 2, drawn.offsetY)) : 0);
  const rect: GhostRect = { x: centerX - sideW / 2 - SELECTION_MARGIN, y: centerY - sideD / 2 - SELECTION_MARGIN, width: sideW + 2 * SELECTION_MARGIN, depth: sideD + 2 * SELECTION_MARGIN, tone: 'target' };
  const range = showReach ? reachTilesOf(building) : [];
  const odorRange = showReach ? nuisanceTilesOf(building) : [];
  return { tiles: [], rects: [rect], valid: true, front: null, ...(range.length ? { range } : {}), ...(odorRange.length ? { odorRange } : {}) };
}

export function evaluateTool(tool: Tool, { state, tile, rotation }: ToolContext): Evaluation {
  switch (tool.kind) {
    case 'building':
      return evaluateBuilding(state, tool.buildingType, tile, rotation, { type: 'PlaceBuilding', buildingType: tool.buildingType, solar: tool.solar, colorVariant: tool.colorVariant }, nextCopyCost(state, tool.buildingType) + (tool.solar ? solarInstallCostOf(tool.buildingType) : 0));
    case 'move': {
      const building = state.buildings.find((candidate) => candidate.id === tool.buildingId);
      if (!building) return evaluation([tile], null, state);
      return evaluateBuilding(state, building.type, tile, rotation, { type: 'MoveBuilding', id: building.id }, 0, building.tier);
    }
    case 'road':
      return evaluateRoad(state, tool, tile);
    case 'pedestrianWay':
      return evaluatePedestrianWay(state, tool, tile);
    case 'walkway':
      return evaluateWalkway(state, tool, tile);
    case 'demolishWalkway':
      return evaluateDemolishWalkway(state, tool, tile);
    case 'pedestrianAccess':
      return evaluateAccess(state, tile, rotation, null);
    case 'movePedestrianAccess':
      return evaluateAccess(state, tile, rotation, tool.from);
    case 'demolishPedestrianAccess':
      return evaluation([tile], { type: 'DemolishPedestrianAccess', x: tile.x, y: tile.y }, state);
    case 'crossing':
      return evaluation([tile], { type: 'PlaceCrossing', x: tile.x, y: tile.y }, state);
    case 'removeCrossing':
      return evaluation([tile], { type: 'RemoveCrossing', x: tile.x, y: tile.y }, state);
    case 'roundabout':
      return evaluation(roundaboutTiles(tile), { type: 'PlaceRoundabout', x: tile.x, y: tile.y }, state);
    case 'demolishRoad':
      return evaluateDemolishRoad(state, tool, tile);
    case 'upgradeRoad':
      return evaluateUpgradeRoad(state, tool, tile);
    case 'demolishPedestrianWay':
      return evaluateDemolishPedestrianWay(state, tool, tile);
    case 'upgradePedestrianWay':
      return evaluateUpgradePedestrianWay(state, tool, tile);
    case 'parcel':
      return evaluateParcel(state, tile);
    case 'bridge':
      return evaluateBridge(state, tool.length, tile, tool.carrier, rotation);
    case 'removeBridge':
      return evaluation([tile], { type: 'RemoveBridge', x: tile.x, y: tile.y }, state);
    case 'moveBridge':
      return evaluateMoveBridge(state, tool.bridge, tile, rotation);
    case 'boat':
      return evaluation([tile], { type: 'BuyBoat', family: tool.family, marinaId: tool.marinaId, x: tile.x, y: tile.y }, state, { cost: BOATS[tool.family].cost });
    case 'brush':
      return evaluateBrush(state, tool, tile);
    case 'replanBuilding':
      return evaluateReplanBuilding(state, tool.buildingType, tile, rotation);
    case 'replanPath':
      return evaluateReplanPath(state, tool, tile);
    case 'replanTile':
      return evaluateReplanTile(state, tool, tile);
    case 'replanBridge':
      return evaluateReplanBridge(state, tool.length, tool.carrier, tile, rotation);
    case 'replanArea':
      return evaluateReplanArea(state, tool, tile);
    case 'replanBoat': {
      const boat = stashOf(state).boats?.find((candidate) => candidate.family === tool.family);
      return evaluation([tile], boat ? replan({ kind: 'placeBoat', id: boat.id, x: tile.x, y: tile.y }) : null, state);
    }
  }
}

// The zone to replan: a rectangle from the first corner to the tile under the pointer.
function evaluateReplanArea(state: GameState, tool: Extract<Tool, { kind: 'replanArea' }>, hovered: Coord): Evaluation {
  const from = tool.start ?? hovered;
  const [x0, y0] = [Math.min(from.x, hovered.x), Math.min(from.y, hovered.y)];
  const rect: GhostRect = { x: x0, y: y0, width: Math.abs(from.x - hovered.x) + 1, depth: Math.abs(from.y - hovered.y) + 1, tone: 'target' };
  const result = evaluation([], tool.start ? { type: 'StartReplan', area: { from, to: hovered } } : null, state);
  return { ...result, ghost: { ...result.ghost, rects: [rect] } };
}

const replan = (action: ReplanAction): Command => ({ type: 'Replan', action });

function evaluateReplanBuilding(state: GameState, type: BuildingType, tile: Coord, requestedRotation: Rotation | null): Evaluation {
  const building = stashOf(state).buildings.find((candidate) => candidate.type === type);
  const rotation = requestedRotation ?? 0;
  const tiles = footprintTiles({ type, x: tile.x, y: tile.y, rotation, tier: building?.tier ?? 1 });
  const command = building ? replan({ kind: 'placeBuilding', id: building.id, x: tile.x, y: tile.y, rotation }) : null;
  return evaluation(tiles, command, state, { rotation });
}

function evaluateReplanPath(state: GameState, tool: Extract<Tool, { kind: 'replanPath' }>, hovered: Coord): Evaluation {
  if (!tool.start) return evaluation([hovered], null, state);
  const path = roadPath(tool.start, hovered, tool.horizontalFirst);
  const mode = NETWORK_OF_LAYER[tool.layer];
  const tileLayer = tool.layer as TileLayer;
  const command = mode
    ? replan({ kind: 'placeNetwork', mode, from: tool.start, to: hovered, horizontalFirst: tool.horizontalFirst })
    : replan({ kind: 'placeTiles', layer: tileLayer, tiles: path, ...(tool.tier ? { tier: tool.tier } : {}) });
  return evaluation(path, command, state);
}

function evaluateReplanTile(state: GameState, tool: Extract<Tool, { kind: 'replanTile' }>, tile: Coord): Evaluation {
  const tiles = tool.layer === 'roundabouts' ? roundaboutTiles(tile) : [tile];
  return evaluation(tiles, replan({ kind: 'placeTiles', layer: tool.layer, tiles: [tile], ...(tool.crossing ? { crossing: true } : {}) }), state);
}

function evaluateReplanBridge(state: GameState, length: number, carrier: 'road' | 'brt' | 'pedestrian' | undefined, tile: Coord, rotation: Rotation | null): Evaluation {
  const index = stashOf(state).bridges?.findIndex((bridge) => bridge.length === length && bridge.carrier === carrier) ?? -1;
  const attempt = (turn: Rotation) => {
    const { axis, side } = carrier === 'pedestrian' ? FOOTBRIDGE_TURNS[turn]! : { axis: turn % 2 === 0 ? 'x' as const : 'y' as const, side: undefined };
    const bridge = { x: tile.x, y: tile.y, length, axis, ...(carrier ? { carrier } : {}), ...(side ? { side } : {}) };
    const command = index === -1 ? null : replan({ kind: 'placeBridge', index, x: tile.x, y: tile.y, axis, ...(side ? { side } : {}) });
    return evaluation(bridgeFootprint(bridge), command, state, { rotation: turn });
  };
  if (rotation !== null) return attempt(rotation);
  const attempts = ((carrier === 'pedestrian' ? [0, 1, 2, 3] : [0, 1]) as Rotation[]).map(attempt);
  return attempts.find((candidate) => candidate.valid) ?? attempts[0]!;
}

function evaluateBuilding(
  state: GameState,
  type: BuildingType,
  tile: Coord,
  requestedRotation: Rotation | null,
  base: { type: 'PlaceBuilding'; buildingType: BuildingType; solar?: boolean; colorVariant?: ColorVariant } | { type: 'MoveBuilding'; id: number },
  cost: number,
  tier = 1,
): Evaluation {
  const reference =
    base.type === 'MoveBuilding' ? { ...state, buildings: state.buildings.filter((building) => building.id !== base.id) } : state;
  const fitted = BUILDING_SPECS[type].requiresRoad ? fittingPlacement(reference, type, tile, tier, requestedRotation) : null;
  const origin = fitted ?? tile;
  const roadFronts = validFronts(reference, type, origin.x, origin.y, tier);
  const fittingFronts = roadFronts.filter((front) => placementIssue(reference, type, origin.x, origin.y, front, { isMove: true, tier }) === null);
  const fronts = fittingFronts.length ? fittingFronts : roadFronts;
  const keepsRequested = requestedRotation !== null && (fronts.length === 0 || fronts.includes(requestedRotation));
  const rotation = fitted?.rotation ?? (keepsRequested ? requestedRotation : autoRotation(reference, type, origin.x, origin.y, tier));
  const command: Command = { ...base, x: origin.x, y: origin.y, rotation };
  const tiles = footprintTiles({ type, x: origin.x, y: origin.y, rotation, tier });
  const result = evaluation(tiles, command, state, { cost, rotation, ...(fronts.length ? { fronts } : {}) });
  if (BUILDING_SPECS[type].requiresRoad) result.ghost.front = frontMarker(reference, type, origin, rotation, tier);
  if (isFacilityType(type)) addCoveragePreview(result, reference, type, origin, rotation);
  const greenRadius = greenProfileOf(type, tier)?.radius;
  if (greenRadius !== undefined) result.ghost.range = greenRangeTiles(type, greenRadius, origin, rotation, tier);
  return result;
}

function addCoveragePreview(result: Evaluation, state: GameState, type: FacilityType, tile: Coord, rotation: Rotation): void {
  const { radius } = FACILITIES[type];
  const covered = previewFacilityCoverage(state, type, tile.x, tile.y, rotation);
  result.coverage = { cityWide: radius === null && FACILITIES[type].category !== 'waste', homes: covered.length };
  result.ghost.rects = covered.map((home) => {
    const { width, depth } = footprintOf(home.type, home.rotation, home.tier);
    return { x: home.x, y: home.y, width, depth, tone: 'hint' as const };
  });
  const nuisanceRadius = nuisanceRadiusOf(type);
  if (nuisanceRadius) result.ghost.odorRange = rangeTiles(type, nuisanceRadius, tile, rotation);
  if (radius === null) return;
  result.ghost.range = rangeTiles(type, radius, tile, rotation);
}

// The distance within which a Waste facility lowers the Well-being of Homes: the Mound's odor, the Incinerator's pollution.
function nuisanceRadiusOf(type: BuildingType): number | null {
  if (type === 'mound') return WASTE_FACILITIES.mound.odor?.radius ?? null;
  if (type === 'incinerator') return WASTE_FACILITIES.incinerator.pollution?.radius ?? null;
  return null;
}

function nuisanceTilesOf(building: Building): Coord[] {
  const radius = nuisanceRadiusOf(building.type);
  if (!radius) return [];
  return rangeTiles(building.type, radius, building, building.rotation, building.tier);
}

function reachTilesOf(building: Building): Coord[] {
  if (building.type === 'casino') return rangeTiles(building.type, casinoRadius(building.tier), building, building.rotation, building.tier);
  if (isSportVenueType(building.type)) return rangeTiles(building.type, SPORT_VENUES[building.type].radius, building, building.rotation);
  const greenRadius = greenProfileOf(building.type, building.tier)?.radius;
  if (greenRadius !== undefined) return greenRangeTiles(building.type, greenRadius, building, building.rotation, building.tier);
  if (!isFacilityType(building.type)) return [];
  return rangeTiles(building.type, facilityRadius(building.type, building.tier), building, building.rotation, building.tier);
}

// Green spaces reach Homes by Manhattan distance between centres, so their reach is a diamond.
function greenRangeTiles(type: BuildingType, radius: number, tile: Coord, rotation: Rotation, tier: number): Coord[] {
  const { width, depth } = footprintOf(type, rotation, tier);
  const center = { x: tile.x + width / 2, y: tile.y + depth / 2 };
  const reach = Math.ceil(radius);
  const range: Coord[] = [];
  for (let dy = -reach - depth; dy <= reach + depth; dy++) {
    for (let dx = -reach - width; dx <= reach + width; dx++) {
      const candidate = { x: Math.floor(center.x) + dx, y: Math.floor(center.y) + dy };
      if (Math.abs(candidate.x + 0.5 - center.x) + Math.abs(candidate.y + 0.5 - center.y) <= radius) range.push(candidate);
    }
  }
  return range;
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
    case 'layWater':
      return { type: 'LayWater', tiles };
    case 'removeWater':
      return { type: 'RemoveWater', tiles };
    case 'plant':
      return tool.crop ? { type: 'Plant', crop: tool.crop, tiles } : null;
    case 'replanField':
      return replan({ kind: 'placeTiles', layer: 'fields', tiles });
    case 'replanWater':
      return replan({ kind: 'placeTiles', layer: 'waterTiles', tiles });
  }
}

function evaluateBrush(state: GameState, tool: Extract<Tool, { kind: 'brush' }>, hovered: Coord): Evaluation {
  const tiles = tool.tiles.length > 0 ? tool.tiles : [hovered];
  const command = brushCommand(tool, tiles);
  return evaluation(tiles, command, state);
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

// A Footbridge has four placements: both axes, with the corridors on either side of the deck.
const FOOTBRIDGE_TURNS = [{ axis: 'x', side: 1 }, { axis: 'y', side: 1 }, { axis: 'x', side: -1 }, { axis: 'y', side: -1 }] as const;

function evaluateFootbridge(state: GameState, length: number, tile: Coord, rotation: Rotation | null): Evaluation {
  const attempt = (turn: Rotation) => {
    const { axis, side } = FOOTBRIDGE_TURNS[turn]!;
    const bridge = { x: tile.x, y: tile.y, length, axis, carrier: 'pedestrian' as const, side };
    const command: Command = { type: 'PlaceBridge', ...bridge };
    return evaluation(bridgeFootprint(bridge), command, state, { cost: bridgeCost(length, 'pedestrian') ?? null, rotation: turn });
  };
  if (rotation !== null) return attempt(rotation);
  const attempts = ([0, 1, 2, 3] as const).map(attempt);
  return attempts.find((candidate) => candidate.valid) ?? attempts[0]!;
}

// First pick the Bridge under the pointer, then place it again with the rotation chosen, keeping its own turn until the player changes it.
function evaluateMoveBridge(state: GameState, picked: Bridge | null, tile: Coord, rotation: Rotation | null): Evaluation {
  if (!picked) {
    const bridge = bridgeAt(state, tile);
    const movable = bridge !== undefined && isInfrastructureBridge(bridge);
    const result = evaluation(bridge ? bridgeFootprint(bridge) : [tile], null, state);
    return { ...result, valid: movable, ghost: { ...result.ghost, valid: movable }, issue: movable ? null : bridge ? 'error.bridgeNotMovable' : 'error.noBridgeHere', ...(movable ? { bridge } : {}) };
  }
  const pedestrian = isPedestrianBridge(picked);
  const turn = (rotation ?? (pedestrian ? FOOTBRIDGE_TURNS.findIndex(({ axis, side }) => axis === picked.axis && side === picked.side) : picked.axis === 'x' ? 0 : 1)) as Rotation;
  const { axis, side } = pedestrian ? FOOTBRIDGE_TURNS[turn]! : { axis: turn % 2 === 0 ? 'x' as const : 'y' as const, side: undefined };
  const target = { x: tile.x, y: tile.y, length: picked.length, axis, carrier: picked.carrier, ...(side ? { side } : {}) };
  const command: Command = { type: 'MoveBridge', from: { x: picked.x, y: picked.y }, x: tile.x, y: tile.y, axis, ...(side ? { side } : {}) };
  return evaluation(bridgeFootprint(target), command, state, { cost: 0, rotation: turn });
}

function evaluateBridge(state: GameState, length: number, tile: Coord, carrier: 'road' | 'brt' | 'pedestrian' | undefined, rotation: Rotation | null): Evaluation {
  if (carrier === 'pedestrian') return evaluateFootbridge(state, length, tile, rotation);
  const attempt = (axis: 'x' | 'y') => {
    const bridge = { x: tile.x, y: tile.y, length, axis, ...(carrier ? { carrier } : {}) };
    const command: Command = { type: 'PlaceBridge', ...bridge };
    return evaluation(bridgeFootprint(bridge), command, state, { cost: bridgeCost(length, carrier) ?? null, rotation: axis === 'x' ? 0 : 1 });
  };
  if (rotation !== null) return attempt(rotation % 2 === 0 ? 'x' : 'y');
  const attempts = (['x', 'y'] as const).map(attempt);
  return attempts.find((candidate) => candidate.valid) ?? attempts[0]!;
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

function evaluatePedestrianWay(state: GameState, tool: Extract<Tool, { kind: 'pedestrianWay' }>, tile: Coord): Evaluation {
  if (!tool.start) return { ghost: { tiles: [tile], rects: [], valid: true, front: null }, valid: true, issue: null, command: null, cost: null, rotation: null };
  const path = roadPath(tool.start, tile, tool.horizontalFirst);
  return evaluation(path, { type: 'BuildPedestrianWay', from: tool.start, to: tile, horizontalFirst: tool.horizontalFirst }, state, { cost: pedestrianWayBuildCost(state, path) });
}

// The open front of a stair turns with the rotation key; moving one keeps its turn until the player changes it.
function evaluateAccess(state: GameState, tile: Coord, rotation: Rotation | null, from: Coord | null): Evaluation {
  const turn = rotation ?? pedestrianAccessRotation(state, from ?? tile);
  const command: Command = from ? { type: 'MovePedestrianAccess', from, x: tile.x, y: tile.y, rotation: turn } : { type: 'BuildPedestrianAccess', x: tile.x, y: tile.y, rotation: turn };
  const result = evaluation([tile], command, state, { rotation: turn, ...(from ? { cost: 0 } : {}) });
  return { ...result, ghost: { ...result.ghost, front: { x: tile.x + 0.5, z: tile.y + 0.5, direction: frontDirection(turn) } } };
}

function evaluateWalkway(state: GameState, tool: Extract<Tool, { kind: 'walkway' }>, tile: Coord): Evaluation {
  if (!tool.start) return { ghost: { tiles: [tile], rects: [], valid: true, front: null }, valid: true, issue: null, command: null, cost: null, rotation: null };
  const path = roadPath(tool.start, tile, tool.horizontalFirst);
  return evaluation(path, { type: 'BuildWalkway', from: tool.start, to: tile, horizontalFirst: tool.horizontalFirst }, state, { cost: walkwayBuildCost(state, path) });
}

function evaluateDemolishWalkway(state: GameState, tool: Extract<Tool, { kind: 'demolishWalkway' }>, tile: Coord): Evaluation {
  if (!tool.start) return evaluation([tile], null, state);
  const path = roadPath(tool.start, tile, tool.horizontalFirst);
  return evaluation(path, { type: 'DemolishWalkwayPath', from: tool.start, to: tile, horizontalFirst: tool.horizontalFirst }, state);
}

function evaluateDemolishPedestrianWay(state: GameState, tool: Extract<Tool, { kind: 'demolishPedestrianWay' }>, tile: Coord): Evaluation {
  if (!tool.start) return evaluation([tile], null, state);
  const path = roadPath(tool.start, tile, tool.horizontalFirst);
  return evaluation(path, { type: 'DemolishPedestrianWayPath', from: tool.start, to: tile, horizontalFirst: tool.horizontalFirst }, state);
}

function evaluateUpgradePedestrianWay(state: GameState, tool: Extract<Tool, { kind: 'upgradePedestrianWay' }>, tile: Coord): Evaluation {
  if (!tool.start) return evaluation([tile], null, state);
  const path = roadPath(tool.start, tile, tool.horizontalFirst);
  return evaluation(path, { type: 'UpgradePedestrianWays', tiles: path }, state);
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
  return evaluation(path, { type: 'UpgradeRoads', tiles: path }, state);
}

export function confirmTool(tool: Tool, tile: Coord, current: Evaluation, keepTool = false): Confirmation {
  if (tool.kind === 'moveBridge' && !tool.bridge) return { command: null, nextTool: current.valid && current.bridge ? { kind: 'moveBridge', bridge: current.bridge } : tool };
  if (tool.kind === 'brush') return { command: current.valid ? current.command : null, nextTool: { ...tool, tiles: [] } };
  const pathTool = isPathTool(tool);
  if (pathTool && !tool.start) return { command: null, nextTool: { ...tool, start: tile } };
  if (!current.valid) return { command: null, nextTool: tool };
  if (tool.kind === 'replanArea') return { command: current.command, nextTool: null };
  if (pathTool) return { command: current.command, nextTool: { ...tool, start: null } };
  if (tool.kind === 'building') return { command: current.command, nextTool: keepTool || tool.repeat ? tool : null };
  if (tool.kind === 'boat') return { command: current.command, nextTool: keepTool ? tool : null };
  if (tool.kind === 'replanBuilding' || tool.kind === 'replanBridge' || tool.kind === 'replanBoat') return { command: current.command, nextTool: tool };
  if (tool.kind === 'move' || tool.kind === 'moveBridge' || tool.kind === 'movePedestrianAccess') return { command: current.command, nextTool: null };
  return { command: current.command, nextTool: tool };
}
