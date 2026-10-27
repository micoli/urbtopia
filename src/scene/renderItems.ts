import { BUILDING_ENTRIES, definitionOf, tiersOf, variantTiersOf } from '../core/buildings/buildingDefinitions';
import { VENUE_TYPES } from '../core/venues/profiles';
import { modelFileOf } from '../core/models/modelFiles';
import { BRIDGE_RAMP_MODEL, BRIDGE_ROAD_MODEL, BRIDGE_SPAN_MODEL, FOOTBRIDGE_MODELS, GROUND_PANEL_MODEL, PARK_TREE_MODEL, RAIL_CORNER_MODEL, RAIL_STRAIGHT_MODEL, ROAD_PIECE_MODELS, ROOF_PANEL_MODEL } from '../core/infrastructure/infrastructure';
import { ANIMAL_MODEL_FILES, ITEM_MODEL_FILES, penAnimalsOf, BOAT_MODELS, FIXTURE_MODELS, FLEET_VEHICLES, CROP_IDS, bridgeRamps, bridgeRoadKeys, bridgeTiles, footbridgeParts, isInfrastructureBridge, isPedestrianBridge, occupiedTiles, waterKeys, FACILITIES, FACILITY_TYPES, GAME_CONFIG, cropStage, footprintOf, isFacilityType, roadExits, roadPiece, tileKey, DIRECTIONS, DIRECTION_VECTORS, roundaboutPiece, neighbour, type Building, type BuildingType, type FacilityType, type CropId, type GameState, type ColorVariant, type ServiceCategory, type Direction, type Coord, solarPanelsOf, solarPanelPlacements, turnedOffset, paintKitOf, colorVariantsOfKit } from '../core';
import type { VenueType } from '../core';
import { WATER_VARIANTS, cornerCode, edgeInfo } from './waterShape';
import { cropModelsOf, growthModelOf, harvestedModelOf, produceModelOf } from './cropModels';
import { VEHICLE_MODELS } from './vehicleModels';
import { BUS_MODEL } from './busModel';
import { SERVICE_VEHICLE_MODELS } from './serviceTrip';
import { VENUE_CUSTOMER_MODELS, VENUE_STAFF_MODELS } from './venueCrowdModels';

export const TEXTURE_VARIANTS = ['roads-a', 'roads-pedestrian'] as const;

export type TextureVariant = (typeof TEXTURE_VARIANTS)[number] | `tone:${string}`;

export interface RenderItem {
  model: string;
  x: number;
  z: number;
  rotation: number;
  elevation?: number;
  lengthScale?: number;
  scale?: number;
  roofBase?: string;
  // Degrees about the item's own Y, X then Z axes, on top of its rotation.
  pitch?: number;
  yaw?: number;
  roll?: number;
  textureVariant?: TextureVariant;
  footprint?: number;
  fitModel?: string;
  tint?: number;
}

export const MODEL_BY_BUILDING = Object.fromEntries(BUILDING_ENTRIES.map(({ id, model }) => [id, modelFileOf(model)])) as Record<BuildingType, string>;

const FACILITY_DETAILS = Object.fromEntries(FACILITY_TYPES.flatMap(type => {
  const { detailModel } = definitionOf(type);
  return detailModel ? [[type, modelFileOf(detailModel)]] : [];
})) as Partial<Record<FacilityType, string>>;

const DRAWN_TO_SCALE = new Set<FacilityType>(FACILITY_TYPES.filter(type => definitionOf(type).drawnToScale));

const CATEGORY_TINTS: Partial<Record<ServiceCategory, number>> = {
  education: 0xb4d0ff,
  administration: 0xf2e2b4,
  culture: 0xe0c8ff,
  health: 0xffc8c8,
  safety: 0xc4f0cb,
};

export const FIELD_SOIL_MODEL = 'procedural/field-soil';
export const WATER_TILE_MODEL = 'procedural/water-tile';
export const BRIDGE_DECK_MODEL = 'procedural/bridge-deck';
export const PROCEDURAL_MODELS: readonly string[] = [FIELD_SOIL_MODEL, BRIDGE_DECK_MODEL];

export function facilityFootprint(building: Pick<Building, 'type'>): number | null {
  if (!isFacilityType(building.type)) return null;
  const { width, depth } = FACILITIES[building.type].footprint;
  return (width + depth) / 2;
}

// The model of each Tier of the buildings defined with Tiers.
const TIER_MODELS = new Map(BUILDING_ENTRIES.filter(({ tiers }) => tiers).map(({ id, model: entryModel }) => [id, tiersOf(id).map(({ model }) => modelFileOf(model ?? entryModel))]));

const SOLAR_PANEL_FILES = BUILDING_ENTRIES.flatMap(({ solarPanels }) => (solarPanels?.panels ?? []).map(({ model }) => modelFileOf(model)));
const SOLAR_HOME_MODELS = new Map(BUILDING_ENTRIES.filter(({ kind, variants }) => kind === 'home' && variants?.solar).map(({ id }) => [id, variantTiersOf(id, 'solar').map(({ model }) => modelFileOf(model!))]));

// The letter of the palette texture of each Home color: the default color is the model's own palette, a to c are its tones b to d.
const TONE_LETTER: Record<ColorVariant, string> = { default: 'a', a: 'b', b: 'c', c: 'd' };

// The models with color tones repaint by swapping their palette texture.
const textureVariantOf = (model: string, colorVariant: ColorVariant = 'default'): TextureVariant | undefined => {
  const kit = paintKitOf(model);
  if (!kit || colorVariant === 'default' || !colorVariantsOfKit(kit).includes(colorVariant)) return undefined;
  return `tone:${model}:${TONE_LETTER[colorVariant]}`;
};

export const TRAIN_MODELS: readonly string[] = [...new Set(FLEET_VEHICLES.flatMap(({ models }) => models.map(modelFileOf)))];

const RAIL_MODELS = [RAIL_STRAIGHT_MODEL, RAIL_CORNER_MODEL];

const shellOf = (type: VenueType) => definitionOf(type).shell!;

// Where the corner piece stands, by kind of Venue: the models of each kit are cut around different origins.
export const VENUE_CORNER_PLACEMENT = Object.fromEntries(
  VENUE_TYPES.map(type => [type, { x: shellOf(type).cornerX, z: shellOf(type).cornerZ, rotation: (shellOf(type).cornerRotation * Math.PI) / 180 }]),
) as Record<VenueType, { x: number; z: number; rotation: number }>;

export const VENUE_SHELL_MODELS = Object.fromEntries(
  VENUE_TYPES.map(type => [type, { floor: modelFileOf(shellOf(type).floor), wall: modelFileOf(shellOf(type).wall), corner: modelFileOf(shellOf(type).corner) }]),
) as Record<VenueType, { floor: string; wall: string; corner: string }>;

const ROAD_MODELS = Object.values(ROAD_PIECE_MODELS);

export const MODEL_KEYS: readonly string[] = [
  ...new Set([
    ...Object.values(MODEL_BY_BUILDING),
    ...[...TIER_MODELS.values()].flat(),
    ...[...SOLAR_HOME_MODELS.values()].flat(),
    ...Object.values(FACILITY_DETAILS),
    ROOF_PANEL_MODEL,
    GROUND_PANEL_MODEL,
    ...SOLAR_PANEL_FILES,
    PARK_TREE_MODEL,
    BRIDGE_ROAD_MODEL,
    BRIDGE_RAMP_MODEL,
    BRIDGE_SPAN_MODEL,
    ...Object.values(FOOTBRIDGE_MODELS),
    ...ROAD_MODELS,
    ...Object.values(VENUE_SHELL_MODELS).flatMap(shell => Object.values(shell)),
    ...VENUE_CUSTOMER_MODELS,
    ...Object.values(VENUE_STAFF_MODELS).flat(),
    ...FIXTURE_MODELS,
    ...RAIL_MODELS,
    ...TRAIN_MODELS,
    ...VEHICLE_MODELS,
    ...Object.values(SERVICE_VEHICLE_MODELS),
    BUS_MODEL,
    ...Object.values(BOAT_MODELS),
    ...CROP_IDS.flatMap((species) => cropModelsOf(species)),
    ...ITEM_MODEL_FILES,
    ...ANIMAL_MODEL_FILES,
  ])
];

export function modelOf(type: BuildingType, tier: number): string {
  const tiered = TIER_MODELS.get(type);
  if (tiered) return tiered[tier - 1] ?? tiered[0]!;
  return MODEL_BY_BUILDING[type];
}

export function modelOfBuilding(building: Building): string {
  const solarModels = building.solar ? SOLAR_HOME_MODELS.get(building.type) : undefined;
  const model = solarModels && building.tier <= solarModels.length ? solarModels[building.tier - 1]! : modelOf(building.type, building.tier);
  return model;
}

let lastBuildingItems: RenderItem[] = [];
const NO_TINTS: ReadonlyMap<string, number> = new Map();

let lastRoadItems: { tints: ReadonlyMap<string, number>; bridges: GameState['bridges']; roads: GameState['roads']; roundabouts: GameState['roundabouts']; rails: GameState['rails']; brtRoads: GameState['brtRoads']; pedestrianWays: GameState['pedestrianWays']; items: RenderItem[] } | null = null;
let lastItems: { buildings: RenderItem[]; roads: RenderItem[]; fields: RenderItem[]; water: RenderItem[]; items: RenderItem[] } | null = null;

function sameItems(a: RenderItem[], b: RenderItem[]): boolean {
  return a.length === b.length && a.every((item, index) => {
    const other = b[index] as RenderItem;
    return item.model === other.model && item.x === other.x && item.z === other.z && item.rotation === other.rotation && item.elevation === other.elevation && item.roofBase === other.roofBase && item.pitch === other.pitch && item.yaw === other.yaw && item.roll === other.roll && item.scale === other.scale && item.lengthScale === other.lengthScale && item.textureVariant === other.textureVariant && item.footprint === other.footprint && item.tint === other.tint;
  });
}

export interface HarvestedTile {
  x: number;
  y: number;
  species: CropId;
}

let lastFieldItems: RenderItem[] = [];
let lastWaterItems: RenderItem[] = [];

export function renderItemsOf(state: GameState, afterHarvest: readonly HarvestedTile[] = [], roadTints: ReadonlyMap<string, number> = NO_TINTS): RenderItem[] {
  const builtBuildings = buildingItems(state);
  const buildings = sameItems(builtBuildings, lastBuildingItems) ? lastBuildingItems : builtBuildings;
  lastBuildingItems = buildings;

  if (lastRoadItems?.roads !== state.roads || lastRoadItems.bridges !== state.bridges || lastRoadItems.roundabouts !== state.roundabouts || lastRoadItems.rails !== state.rails || lastRoadItems.brtRoads !== state.brtRoads || lastRoadItems.pedestrianWays !== state.pedestrianWays || lastRoadItems.tints !== roadTints) {
    lastRoadItems = { tints: roadTints, bridges: state.bridges, roads: state.roads, roundabouts: state.roundabouts, rails: state.rails, brtRoads: state.brtRoads, pedestrianWays: state.pedestrianWays, items: [...tinted(roadItems(state), roadTints), ...pedestrianWayItems(state), ...brtItems(state), ...railItems(state), ...bridgeItems(state, roadTints), ...footbridgeItems(state)] };
  }
  const roads = lastRoadItems.items;

  const builtFields = fieldItems(state, afterHarvest);
  const fields = sameItems(builtFields, lastFieldItems) ? lastFieldItems : builtFields;
  lastFieldItems = fields;

  const builtWater = waterItems(state);
  const water = sameItems(builtWater, lastWaterItems) ? lastWaterItems : builtWater;
  lastWaterItems = water;

  if (lastItems && lastItems.buildings === buildings && lastItems.roads === roads && lastItems.fields === fields && lastItems.water === water) return lastItems.items;
  const items = [...buildings, ...roads, ...fields, ...water];
  lastItems = { buildings, roads, fields, water, items };
  return items;
}

const PRODUCE_OFFSET = 0.22;
const PRODUCE_ELEVATION = 0.03;

function fieldItems(state: GameState, afterHarvest: readonly HarvestedTile[]): RenderItem[] {
  const harvestedAt = new Map(afterHarvest.map((tile) => [tileKey(tile), tile.species]));
  return state.fields.flatMap((field) => {
    const x = field.x + 0.5;
    const z = field.y + 0.5;
    const soil: RenderItem = { model: FIELD_SOIL_MODEL, x, z, rotation: 0 };
    if (!field.crop) {
      const harvested = harvestedAt.get(tileKey(field));
      const model = harvested ? harvestedModelOf(harvested) : null;
      return model ? [soil, { model, x, z, rotation: 0 }] : [soil];
    }
    const stage = cropStage(field.crop, state.lastSeen);
    if (stage !== 'ready') return [soil, { model: growthModelOf(field.crop.species, stage), x, z, rotation: 0 }];
    const produce = produceModelOf(field.crop.species);
    return [
      soil,
      { model: growthModelOf(field.crop.species, 4), x, z, rotation: 0 },
      ...(produce ? [{ model: produce, x: x + PRODUCE_OFFSET, z: z + PRODUCE_OFFSET, rotation: 0, elevation: PRODUCE_ELEVATION }] : []),
    ];
  });
}

function waterItems(state: GameState): RenderItem[] {
  const tiles = state.waterTiles ?? [];
  if (tiles.length === 0) return [];
  const water = waterKeys(state);
  let occupied: Set<string> | null = null;
  const neighbourhood = {
    isWater: (x: number, y: number) => water.has(tileKey({ x, y })),
    isFree: (x: number, y: number) => !(occupied ??= occupiedTiles(state)).has(tileKey({ x, y })),
  };
  return tiles.map((tile) => {
    const edges = edgeInfo(tile.x, tile.y, neighbourhood);
    const variant = /[01]/.test(edges) ? Math.abs((tile.x * 73856093) ^ (tile.y * 19349663)) % WATER_VARIANTS : 0;
    return { model: `${WATER_TILE_MODEL}:${cornerCode(tile.x, tile.y, neighbourhood)}:${edges}:${variant}`, x: tile.x + 0.5, z: tile.y + 0.5, rotation: 0 };
  });
}

function tinted(items: RenderItem[], tints: ReadonlyMap<string, number>): RenderItem[] {
  if (tints.size === 0) return items;
  return items.map((item) => {
    const tint = tints.get(tileKey({ x: Math.floor(item.x), y: Math.floor(item.z) }));
    return tint === undefined ? item : { ...item, tint };
  });
}

function roadItems(state: GameState): RenderItem[] {
  const brtKeys = new Set((state.brtRoads ?? []).map(tileKey));
  const onBridge = bridgeRoadKeys(state);
  const tiles = state.roads.filter((road) => !onBridge.has(tileKey(road))).map((road) => {
    if (brtKeys.has(tileKey(road))) return { model: ROAD_PIECE_MODELS.crossroad, x: road.x + 0.5, z: road.y + 0.5, rotation: 0 };
    const { piece, rotation } = roadPiece(roadExits(state, road), road.kind);
    return { model: ROAD_PIECE_MODELS[piece], x: road.x + 0.5, z: road.y + 0.5, rotation };
  });
  const roadKeys = new Set(state.roads.map(tileKey));
  const roundabouts = state.roundabouts.map((center) => {
    const exits = DIRECTIONS.filter((direction: Direction) => {
      const vector = DIRECTION_VECTORS[direction];
      return roadKeys.has(tileKey({ x: center.x + 2 * vector.x, y: center.y + 2 * vector.y }));
    });
    const { piece, rotation } = roundaboutPiece(exits);
    return { model: ROAD_PIECE_MODELS[piece], x: center.x + 0.5, z: center.y + 0.5, rotation };
  });
  return [...tiles, ...roundabouts];
}

function pedestrianWayItems(state: GameState): RenderItem[] {
  const tiles = state.pedestrianWays ?? [];
  const keys = new Set(tiles.map(tileKey));
  return tiles.map((tile) => {
    const exits = DIRECTIONS.filter((direction: Direction) => keys.has(tileKey(neighbour(tile, direction))));
    const { piece, rotation } = roadPiece(exits);
    return { model: ROAD_PIECE_MODELS[piece], x: tile.x + 0.5, z: tile.y + 0.5, rotation, textureVariant: 'roads-pedestrian' };
  });
}

// Quarter turns of the Kenney models: the road of a ramp runs along +X and rises towards +X, the road of a deck runs along Z.
const AXIS_TURNS = { x: { forward: 0, back: 2, deck: 1 }, y: { forward: 3, back: 1, deck: 0 } } as const;

// Traffic crosses a Bridge from ramp to ramp, so the whole Bridge takes the tint of its ramps, never that of the Road beneath its span.
function bridgeItems(state: GameState, tints: ReadonlyMap<string, number>): RenderItem[] {
  return (state.bridges ?? []).filter((bridge) => isInfrastructureBridge(bridge) && !isPedestrianBridge(bridge)).flatMap((bridge) => {
    const [first, last] = bridgeRamps(bridge);
    const turns = AXIS_TURNS[bridge.axis];
    const tint = tints.get(tileKey(first!)) ?? tints.get(tileKey(last!));
    const at = (model: string, tile: Coord, rotation: number): RenderItem => ({ model, x: tile.x + 0.5, z: tile.y + 0.5, rotation, ...(bridge.carrier === 'brt' ? { textureVariant: 'roads-a' as const } : {}), ...(tint === undefined ? {} : { tint }) });
    return [at(BRIDGE_RAMP_MODEL, first!, turns.forward), ...bridgeTiles(bridge).map((tile) => at(BRIDGE_SPAN_MODEL, tile, turns.deck)), at(BRIDGE_RAMP_MODEL, last!, turns.back)];
  });
}

const TURNS_FROM_EAST: Record<Direction, number> = { E: 0, N: 1, W: 2, S: 3 };
const OPPOSITE_DIRECTION: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' };

// The Footbridge models are drawn along +X and turn counter-clockwise on the map, E to N to W to S. The stair is entered from the corridor and left towards the deck: it is the left-hand model when the corridor lies a quarter turn counter-clockwise from the exit, the right-hand one otherwise.
function footbridgeItems(state: GameState): RenderItem[] {
  return (state.bridges ?? []).filter(isPedestrianBridge).flatMap((bridge) => {
    const { stairs, corridors, deck } = footbridgeParts(bridge);
    const [forward, back]: [Direction, Direction] = bridge.axis === 'x' ? ['E', 'W'] : ['S', 'N'];
    const toCorridor: Direction = bridge.axis === 'x' ? (bridge.side === -1 ? 'N' : 'S') : (bridge.side === -1 ? 'W' : 'E');
    const at = (model: string, tile: Coord, rotation: number): RenderItem => ({ model, x: tile.x + 0.5, z: tile.y + 0.5, rotation, textureVariant: 'roads-pedestrian' });
    const stair = (tile: Coord, exit: Direction): RenderItem => {
      const left = (TURNS_FROM_EAST[toCorridor] - TURNS_FROM_EAST[exit] + 4) % 4 === 1;
      return at(left ? FOOTBRIDGE_MODELS.stairLeft : FOOTBRIDGE_MODELS.stairRight, tile, TURNS_FROM_EAST[exit]);
    };
    const corridorTurn = (TURNS_FROM_EAST[OPPOSITE_DIRECTION[toCorridor]] + 1) % 4;
    return [
      ...corridors.map((tile) => at(FOOTBRIDGE_MODELS.corridor, tile, corridorTurn)),
      stair(stairs[0], forward),
      stair(stairs[1], back),
      ...deck.map((tile) => at(FOOTBRIDGE_MODELS.deck, tile, bridge.axis === 'x' ? 0 : 1)),
    ];
  });
}

function brtItems(state: GameState): RenderItem[] {
  const roadKeys = new Set(state.roads.map(tileKey));
  const ramps = bridgeRoadKeys(state);
  return (state.brtRoads ?? []).filter(tile => !roadKeys.has(tileKey(tile)) && !ramps.has(tileKey(tile))).map(tile => {
    const { piece, rotation } = roadPiece(tile.exits, tile.kind === 'crossing' ? 'crossing' : 'road');
    return { model: ROAD_PIECE_MODELS[piece], x: tile.x + 0.5, z: tile.y + 0.5, rotation, textureVariant: 'roads-a' as const };
  });
}

// A Home whose solar models cover its Tier already shows its panels; any other equipped building gets the panels its definition lists on the roof, a flat panel per tile without any.
function solarPanelItems(building: Building, roofModel: string, rotation: number, x: number, z: number): RenderItem[] {
  const panels = solarPanelsOf(building.type);
  if (!building.solar || !panels) return [];
  if (building.tier <= (SOLAR_HOME_MODELS.get(building.type)?.length ?? 0)) return [];
  const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
  return solarPanelPlacements(width, depth, panels.panels).map(panel => {
    const offset = turnedOffset(panel.x, panel.z, rotation);
    return {
      model: panel.model ? modelFileOf(panel.model) : ROOF_PANEL_MODEL, x: x + offset.x, z: z + offset.z, rotation, roofBase: roofModel,
      ...(panel.y ? { elevation: panel.y } : {}), ...(panel.rotationX ? { pitch: panel.rotationX } : {}), ...(panel.rotationY ? { yaw: panel.rotationY } : {}), ...(panel.rotationZ ? { roll: panel.rotationZ } : {}), ...(panel.scale !== 1 ? { scale: panel.scale } : {}),
    };
  });
}

const PEN_FLOOR = 0.01;

// The animals standing in the Pens of a Livestock farm, one per production running or waiting to be collected.
function penAnimalItems(building: Building, rotation: number, x: number, z: number): RenderItem[] {
  return penAnimalsOf(building).map(({ x: penX, z: penZ, animal }) => {
    const offset = turnedOffset(penX, penZ, rotation);
    return { model: modelFileOf(animal), x: x + offset.x, z: z + offset.z, rotation, elevation: PEN_FLOOR };
  });
}

function buildingItems(state: GameState): RenderItem[] {
  return state.buildings.flatMap((building) => {
    const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
    const x = building.x + width / 2;
    const z = building.y + depth / 2;
    const rotation = building.rotation;
    const model = modelOfBuilding(building);
    const scale = tiersOf(building.type)[building.tier - 1]?.scale;
    const textureVariant = textureVariantOf(model, building.colorVariant);
    const items: RenderItem[] = [{ model, x, z, rotation, ...(scale ? { scale } : {}), ...(textureVariant ? { textureVariant } : {}) }];
    if (isFacilityType(building.type) && !DRAWN_TO_SCALE.has(building.type)) {
      const footprint = facilityFootprint(building)!;
      const tint = CATEGORY_TINTS[FACILITIES[building.type].category];
      items[0] = { ...items[0]!, footprint, fitModel: model, ...(tint === undefined ? {} : { tint }) };
      const detail = FACILITY_DETAILS[building.type];
      if (detail) items.push({ model: detail, x, z, rotation, footprint, fitModel: model });
    }
    if (building.type === 'park') {
      items.push({ model: PARK_TREE_MODEL, x: x - width / 4, z: z - depth / 4, rotation, ...(scale ? { scale } : {}) });
      items.push({ model: PARK_TREE_MODEL, x: x + width / 4, z: z + depth / 4, rotation, ...(scale ? { scale } : {}) });
    }
    items.push(...solarPanelItems(building, model, rotation, x, z));
    items.push(...penAnimalItems(building, rotation, x, z));
    return items;
  });
}

export function chunkKeyOf(x: number, z: number, size = GAME_CONFIG.parcelSizeInTiles): string {
  return `${Math.floor(x / size)},${Math.floor(z / size)}`;
}

export function railItems(state: GameState): RenderItem[] {
  return (state.rails ?? []).flatMap(tile => {
    const base = { x: tile.x + .5, z: tile.y + .5, elevation: .035 };
    const straight = RAIL_STRAIGHT_MODEL, corner = RAIL_CORNER_MODEL;
    const exits = tile.exits;
    if (exits.length <= 1 || (exits.length === 2 && ((exits.includes('E') && exits.includes('W')) || (exits.includes('N') && exits.includes('S'))))) {
      return [{ ...base, model: straight, rotation: exits.includes('E') || exits.includes('W') ? 1 : 0 }];
    }
    if (exits.length === 2) {
      const pairs = [['N', 'W'], ['W', 'S'], ['S', 'E'], ['E', 'N']];
      const rotation = pairs.findIndex(pair => pair.every(d => exits.includes(d as typeof exits[number])));
      return [{ ...base, model: corner, rotation }];
    }
    return exits.map(d => ({ ...base, model: straight, lengthScale: .5,
      x: base.x + (d === 'E' ? .25 : d === 'W' ? -.25 : 0), z: base.z + (d === 'S' ? .25 : d === 'N' ? -.25 : 0),
      rotation: d === 'E' || d === 'W' ? 1 : 0 }));
  });
}
