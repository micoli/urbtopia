import { SPORT_VENUES, SPORT_VENUE_TYPES, type SportVenueType } from '../core/leisure/sportVenues';
import { CROP_IDS, DIRECTION_VECTORS, FACILITIES, FACILITY_TYPES, GAME_CONFIG, cropStage, footprintOf, frontDirection, isFacilityType, roadExits, roadPiece, tileKey, type Building, type BuildingType, type FacilityType, type CropId, type GameState, type ServiceCategory } from '../core';
import { cropModelsOf, growthModelOf, harvestedModelOf, produceModelOf } from './cropModels';
import { NATURE_MODELS, type NatureType } from '../core/environment/nature';
import { VEHICLE_MODELS } from './vehicleModels';
import { BUS_MODEL } from './busModel';
import { SERVICE_VEHICLE_MODELS } from './serviceTrip';

export type TextureVariant = 'a' | 'b' | 'c' | 'roads-a';

export interface RenderItem {
  model: string;
  x: number;
  z: number;
  rotation: number;
  elevation?: number;
  lengthScale?: number;
  roofBase?: string;
  textureVariant?: TextureVariant;
  footprint?: number;
  recolor?: number;
  decal?: { x: number; z: number; lateral?: number; height?: number };
  fitModel?: string;
  tint?: number;
}

export const MODEL_BY_BUILDING: Record<BuildingType, string> = {
  ...Object.fromEntries(SPORT_VENUE_TYPES.map(type => [type, SPORT_VENUES[type].model])) as Record<SportVenueType, string>,
  ...Object.fromEntries(NATURE_MODELS.map(([type, model]) => [type, model])) as Record<NatureType, string>,
  workshop: 'industrial/building-h',
  factory: 'industrial/building-b',
  shop: 'commercial/building-a',
  storehouse: 'industrial/building-a',
  home: 'suburban/building-type-k',
  powerPlant: 'industrial/windmill',
  coalPlant: 'industrial/chimney-basic',
  waterTower: 'industrial/water-tower',
  silo: 'industrial/building-p',
  grainSilo: 'farm/Silo_House',
  vault: 'industrial/building-s',
  casino: 'buildings/2Story_Stairs_Mat',
  farm: 'farm/Barn',
  packhouse: 'farm/OpenBarn',
  tree: 'suburban/tree-small',
  park: 'suburban/tree-large',
  solar: 'industrial/solar-panel-landscape-group',
  battery: 'industrial/shipping-container-a',
  backup: 'industrial/building-d',
  brtStation: 'roads/road-sign-empty',
  railStation: 'industrial/building-q',
  busStop: 'roads/road-sign-empty',
  school: 'commercial/building-d',
  middleSchool: 'commercial/building-f',
  highSchool: 'commercial/building-g',
  university: 'commercial/building-l',
  townHall: 'commercial/building-k',
  communityHall: 'commercial/building-a',
  theater: 'commercial/building-b',
  concertHall: 'commercial/building-n',
  hospital: 'commercial/building-i',
  fireStation: 'industrial/building-s',
  policeStation: 'commercial/building-j',
};

const FACILITY_DETAILS: Record<FacilityType, string> = {
  school: 'commercial/detail-awning',
  middleSchool: 'commercial/detail-overhang',
  highSchool: 'commercial/detail-awning-wide',
  university: 'commercial/detail-overhang-wide',
  townHall: 'commercial/detail-awning-wide',
  communityHall: 'commercial/detail-parasol-a',
  theater: 'commercial/detail-overhang-wide',
  concertHall: 'commercial/detail-awning',
  hospital: 'commercial/detail-parasol-b',
  fireStation: 'commercial/detail-overhang',
  policeStation: 'commercial/detail-awning',
};

const CATEGORY_TINTS: Record<ServiceCategory, number> = {
  education: 0xb4d0ff,
  administration: 0xf2e2b4,
  culture: 0xe0c8ff,
  health: 0xffc8c8,
  safety: 0xc4f0cb,
};

export const RED_CROSS_MODEL = 'procedural/red-cross';
export const GARAGE_DOOR_MODEL = 'procedural/garage-door';
export const FIELD_SOIL_MODEL = 'procedural/field-soil';
export const PROCEDURAL_MODELS: readonly string[] = [RED_CROSS_MODEL, GARAGE_DOOR_MODEL, FIELD_SOIL_MODEL];

const GARAGE_DOOR_SPACING = 0.6;
const GARAGE_DOOR_HEIGHT = 0.27;

const FACILITY_RECOLORS: Partial<Record<FacilityType, number>> = {
  hospital: 0xffffff,
  fireStation: 0xd9322b,
  policeStation: 0x2f5fd0,
};

const FOOTPRINT_BOOST: Partial<Record<FacilityType, number>> = { townHall: 1.3 };

export function facilityFootprint(building: Pick<Building, 'type'>): number | null {
  if (!isFacilityType(building.type)) return null;
  const { width, depth } = FACILITIES[building.type].footprint;
  return ((width + depth) / 2) * (FOOTPRINT_BOOST[building.type] ?? 1);
}

const FACTORY_MODELS = ['industrial/building-b', 'industrial/building-e', 'industrial/building-f', 'industrial/building-l', 'industrial/building-c'];

const COAL_MODELS = ['industrial/chimney-basic', 'industrial/chimney-small', 'industrial/chimney-medium', 'industrial/chimney-large'];

const STOREHOUSE_MODELS = ['industrial/building-a', 'industrial/building-a', 'industrial/building-a', 'industrial/building-q', 'industrial/building-q', 'industrial/building-q'];

const GRAIN_SILO_MODELS = ['farm/Silo_House', 'farm/Silo_House', 'farm/Silo_House', 'farm/Silo', 'farm/Silo', 'farm/Silo'];

const CASINO_MODELS = ['buildings/2Story_Stairs_Mat', 'buildings/2Story_Wide_Mat', 'buildings/2Story_Wide_2Doors_Mat'];

const HOME_MODELS = [
  'suburban/building-type-k',
  'suburban/building-type-h',
  'suburban/building-type-a',
  'suburban/building-type-h',
  'suburban/building-type-f',
  'suburban/building-type-n',
  'suburban/building-type-t',
  'suburban/building-type-m',
];

const SOLAR_HOME_MODELS = ['suburban/building-type-j', 'suburban/building-type-u', 'suburban/building-type-b'];
const ROOF_PANEL_MODEL = 'industrial/solar-panel-flat';
const SOLAR_PANEL_MODEL = 'industrial/solar-panel-landscape';

export const TRAIN_MODELS = ['trains/train-electric-city-a', 'trains/train-electric-city-b', 'trains/train-locomotive-a', 'trains/train-locomotive-passenger-a', 'trains/train-electric-city-c'];

const RAIL_MODELS = ['trains/railroad-straight', 'trains/railroad-corner-small'];

const ROAD_MODELS = ['square', 'end', 'straight', 'bend', 'intersection', 'crossroad', 'crossing', 'roundabout'].map((piece) => `roads/road-${piece}`);

export const MODEL_KEYS: readonly string[] = [
  ...new Set([
    ...Object.values(MODEL_BY_BUILDING),
    ...FACTORY_MODELS,
    ...COAL_MODELS,
    ...STOREHOUSE_MODELS,
    ...GRAIN_SILO_MODELS,
    ...CASINO_MODELS,
    ...HOME_MODELS,
    ...SOLAR_HOME_MODELS,
    ...FACILITY_TYPES.map(type => FACILITY_DETAILS[type]),
    ROOF_PANEL_MODEL,
    SOLAR_PANEL_MODEL,
    ...ROAD_MODELS,
    ...RAIL_MODELS,
    ...TRAIN_MODELS,
    ...VEHICLE_MODELS,
    ...Object.values(SERVICE_VEHICLE_MODELS),
    BUS_MODEL,
    ...CROP_IDS.flatMap((species) => cropModelsOf(species)),
  ])
];

export function modelOf(type: BuildingType, tier: number): string {
  if (type === 'home') return HOME_MODELS[tier - 1] ?? MODEL_BY_BUILDING.home;
  if (type === 'factory') return FACTORY_MODELS[tier - 1] ?? MODEL_BY_BUILDING.factory;
  if (type === 'coalPlant') return COAL_MODELS[tier - 1] ?? MODEL_BY_BUILDING.coalPlant;
  if (type === 'storehouse') return STOREHOUSE_MODELS[tier - 1] ?? MODEL_BY_BUILDING.storehouse;
  if (type === 'grainSilo') return GRAIN_SILO_MODELS[tier - 1] ?? MODEL_BY_BUILDING.grainSilo;
  if (type === 'casino') return CASINO_MODELS[tier - 1] ?? MODEL_BY_BUILDING.casino;
  return MODEL_BY_BUILDING[type];
}

export function modelOfBuilding(building: Building): string {
  if (building.type === 'home' && building.solar && building.tier <= 4) {
    return SOLAR_HOME_MODELS[building.tier === 1 ? 0 : building.tier === 4 ? 2 : 1] as string;
  }
  return modelOf(building.type, building.tier);
}

let lastBuildingItems: RenderItem[] = [];
let lastRoadItems: { roads: GameState['roads']; roundabouts: GameState['roundabouts']; rails: GameState['rails']; brtRoads: GameState['brtRoads']; items: RenderItem[] } | null = null;
let lastItems: { buildings: RenderItem[]; roads: RenderItem[]; fields: RenderItem[]; items: RenderItem[] } | null = null;

function sameItems(a: RenderItem[], b: RenderItem[]): boolean {
  return a.length === b.length && a.every((item, index) => {
    const other = b[index] as RenderItem;
    return item.model === other.model && item.x === other.x && item.z === other.z && item.rotation === other.rotation && item.elevation === other.elevation && item.roofBase === other.roofBase && item.lengthScale === other.lengthScale && item.textureVariant === other.textureVariant && item.footprint === other.footprint && item.recolor === other.recolor && item.decal?.x === other.decal?.x && item.decal?.z === other.decal?.z && item.decal?.lateral === other.decal?.lateral && item.tint === other.tint;
  });
}

export interface HarvestedTile {
  x: number;
  y: number;
  species: CropId;
}

let lastFieldItems: RenderItem[] = [];

export function renderItemsOf(state: GameState, afterHarvest: readonly HarvestedTile[] = []): RenderItem[] {
  const builtBuildings = buildingItems(state);
  const buildings = sameItems(builtBuildings, lastBuildingItems) ? lastBuildingItems : builtBuildings;
  lastBuildingItems = buildings;

  if (lastRoadItems?.roads !== state.roads || lastRoadItems.roundabouts !== state.roundabouts || lastRoadItems.rails !== state.rails || lastRoadItems.brtRoads !== state.brtRoads) {
    lastRoadItems = { roads: state.roads, roundabouts: state.roundabouts, rails: state.rails, brtRoads: state.brtRoads, items: [...roadItems(state), ...brtItems(state), ...railItems(state)] };
  }
  const roads = lastRoadItems.items;

  const builtFields = fieldItems(state, afterHarvest);
  const fields = sameItems(builtFields, lastFieldItems) ? lastFieldItems : builtFields;
  lastFieldItems = fields;

  if (lastItems && lastItems.buildings === buildings && lastItems.roads === roads && lastItems.fields === fields) return lastItems.items;
  const items = [...buildings, ...roads, ...fields];
  lastItems = { buildings, roads, fields, items };
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

function roadItems(state: GameState): RenderItem[] {
  const brtKeys = new Set((state.brtRoads ?? []).map(tileKey));
  const tiles = state.roads.map((road) => {
    if (brtKeys.has(tileKey(road))) return { model: 'roads/road-crossroad', x: road.x + 0.5, z: road.y + 0.5, rotation: 0 };
    const { piece, rotation } = roadPiece(roadExits(state, road), road.kind);
    return { model: `roads/road-${piece}`, x: road.x + 0.5, z: road.y + 0.5, rotation };
  });
  const roundabouts = state.roundabouts.map((center) => ({ model: 'roads/road-roundabout', x: center.x + 0.5, z: center.y + 0.5, rotation: 0 }));
  return [...tiles, ...roundabouts];
}

function brtItems(state: GameState): RenderItem[] {
  const roadKeys = new Set(state.roads.map(tileKey));
  return (state.brtRoads ?? []).filter(tile => !roadKeys.has(tileKey(tile))).map(tile => {
    const { piece, rotation } = roadPiece(tile.exits);
    return { model: `roads/road-${piece}`, x: tile.x + 0.5, z: tile.y + 0.5, rotation, textureVariant: 'roads-a' as const };
  });
}

function redCrossItems(x: number, z: number, rotation: number, footprint: number, fitModel: string): RenderItem[] {
  const front = DIRECTION_VECTORS[frontDirection(rotation)];
  const faces = [front, { x: front.y, y: -front.x }, { x: -front.y, y: front.x }];
  return faces.map((face) => ({ model: RED_CROSS_MODEL, x, z, rotation, footprint, fitModel, decal: { x: face.x, z: face.y } }));
}

function garageDoorItems(x: number, z: number, rotation: number, footprint: number, fitModel: string): RenderItem[] {
  const front = DIRECTION_VECTORS[frontDirection(rotation)];
  return [-1, 0, 1].map((slot) => ({
    model: GARAGE_DOOR_MODEL, x, z, rotation, footprint, fitModel,
    decal: { x: front.x, z: front.y, lateral: slot * GARAGE_DOOR_SPACING, height: GARAGE_DOOR_HEIGHT },
  }));
}

function buildingItems(state: GameState): RenderItem[] {
  return state.buildings.flatMap((building) => {
    const { width, depth } = footprintOf(building.type, building.rotation, building.tier);
    const x = building.x + width / 2;
    const z = building.y + depth / 2;
    const rotation = building.rotation;
    const model = modelOfBuilding(building);
    const items: RenderItem[] = [{ model, x, z, rotation, ...(building.type === 'home' && building.colorVariant && building.colorVariant !== 'default' ? { textureVariant: building.colorVariant } : {}) }];
    if (isFacilityType(building.type)) {
      const footprint = facilityFootprint(building)!;
      const recolor = FACILITY_RECOLORS[building.type];
      items[0] = { ...items[0]!, footprint, fitModel: model, ...(recolor === undefined ? { tint: CATEGORY_TINTS[FACILITIES[building.type].category] } : { recolor }) };
      items.push({ model: FACILITY_DETAILS[building.type], x, z, rotation, footprint, fitModel: model });
      if (building.type === 'hospital') items.push(...redCrossItems(x, z, rotation, footprint, model));
      if (building.type === 'fireStation') items.push(...garageDoorItems(x, z, rotation, footprint, model));
    }
    if (building.type === 'park') {
      items.push({ model: 'suburban/tree-small', x: x - width / 4, z: z - depth / 4, rotation });
      items.push({ model: 'suburban/tree-small', x: x + width / 4, z: z + depth / 4, rotation });
    }
    if (building.type === 'home' && building.solar && building.tier > 4) {
      items.push({ model: ROOF_PANEL_MODEL, x, z, rotation, elevation: 1.3, roofBase: model });
    }
    return items;
  });
}

export function chunkKeyOf(x: number, z: number): string {
  const size = GAME_CONFIG.parcelSizeInTiles;
  return `${Math.floor(x / size)},${Math.floor(z / size)}`;
}

export function railItems(state: GameState): RenderItem[] {
  return (state.rails ?? []).flatMap(tile => {
    const base = { x: tile.x + .5, z: tile.y + .5, elevation: .035 };
    const straight = 'trains/railroad-straight', corner = 'trains/railroad-corner-small';
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
