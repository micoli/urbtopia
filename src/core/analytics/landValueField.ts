import { createBuilding } from '../buildings/buildingSpecs';
import { ECOLOGY, centerOf, greenBenefits } from '../environment/ecology';
import { leisureRetention } from '../leisure/leisure';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import { FACILITIES, SERVICE_CATEGORIES, isWithinReach, type FacilityType } from '../services/facilities';
import { congestionStats } from '../traffic/congestion';
import { CONGESTION } from '../traffic/roadTier';
import type { Building, GameState } from '../engine/state';
import { odorField } from './odorField';
import { pollutionField } from './pollutionField';
import { MAP_TILES, buildTileField, fieldValueAt, splat, type TileField } from './tileField';

// Tunable in .scratch/analytics-view/balancing.md. Positive weights add to 1; the nuisance weights add to 1.
export const LAND_VALUE = {
  max: 100,
  weights: { green: 0.35, services: 0.3, leisure: 0.15, access: 0.2 },
  nuisanceWeights: { pollution: 0.5, odor: 0.3, congestion: 0.2 },
  maxNuisanceCut: 0.6,
  leisureSaturation: 0.3,
  roadReach: 2,
  stopReach: ECOLOGY.stopRadius,
  congestionReach: 3,
  roadShare: 0.5,
};

const STOP_TYPES = ['busStop', 'brtStation', 'railStation', 'transitHub'];

const cache = new WeakMap<GameState, TileField>();

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function accessGrids(state: GameState) {
  const roads = new Float32Array(MAP_TILES * MAP_TILES);
  const stops = new Float32Array(MAP_TILES * MAP_TILES);
  const jam = new Float32Array(MAP_TILES * MAP_TILES);
  for (const road of state.roads) splat(roads, road.x, road.y, LAND_VALUE.roadReach, 1);
  for (const way of state.pedestrianWays ?? []) splat(roads, way.x, way.y, LAND_VALUE.roadReach, 1);
  for (const building of state.buildings) {
    if (STOP_TYPES.includes(building.type)) splat(stops, Math.floor(building.x), Math.floor(building.y), LAND_VALUE.stopReach, 1);
  }
  for (const section of congestionStats(state).sections.values()) {
    splat(jam, section.tile.x, section.tile.y, LAND_VALUE.congestionReach, clamp01((section.ratio - 1) / (CONGESTION.maxRatio - 1)));
  }
  return { roads, stops, jam };
}

function servicesShare(facilities: ReadonlyMap<string, readonly Building[]>, home: Building): number {
  const centre = centerOf(home);
  let reached = 0;
  for (const category of SERVICE_CATEGORIES) {
    const inCategory = facilities.get(category) ?? [];
    const covers = inCategory.some(facility => {
      const { radius } = FACILITIES[facility.type as FacilityType];
      if (radius === null) return true;
      const from = centerOf(facility);
      return isWithinReach(centre.x - from.x, centre.y - from.y, radius);
    });
    if (covers) reached++;
  }
  return reached / SERVICE_CATEGORIES.length;
}

interface LandValueContext {
  grids: ReturnType<typeof accessGrids>;
  facilities: ReadonlyMap<string, readonly Building[]>;
  powered: ReadonlySet<number>;
  pollution: TileField;
  odor: TileField;
}

const contexts = new WeakMap<GameState, LandValueContext>();

function contextOf(state: GameState): LandValueContext {
  const cached = contexts.get(state);
  if (cached) return cached;
  const facilities = new Map<string, Building[]>();
  for (const building of state.buildings) {
    const spec = FACILITIES[building.type as FacilityType];
    if (spec) facilities.set(spec.category, [...(facilities.get(spec.category) ?? []), building]);
  }
  const context = { grids: accessGrids(state), facilities, powered: poweredCasinoIds(state), pollution: pollutionField(state), odor: odorField(state) };
  contexts.set(state, context);
  return context;
}

// What a tile owes its value to: shares from 0 to 1 for each source, before weighting.
export interface LandValueParts {
  green: number;
  services: number;
  leisure: number;
  access: number;
  pollution: number;
  odor: number;
  congestion: number;
}

export function landValuePartsAt(state: GameState, x: number, y: number): LandValueParts {
  const { grids, facilities, powered, pollution, odor } = contextOf(state);
  const home = createBuilding(0, 'home', x, y, 0);
  const index = y * MAP_TILES + x;
  return {
    green: greenBenefits(state, home).wellbeing / 100,
    services: servicesShare(facilities, home),
    leisure: clamp01((1 - leisureRetention(state, home, powered, 100)) / LAND_VALUE.leisureSaturation),
    access: grids.roads[index]! * LAND_VALUE.roadShare + grids.stops[index]! * (1 - LAND_VALUE.roadShare),
    pollution: clamp01(fieldValueAt(pollution, x, y) / pollution.max),
    odor: clamp01(fieldValueAt(odor, x, y) / odor.max),
    congestion: grids.jam[index]!,
  };
}

export function landValueOf(parts: LandValueParts): number {
  const { weights, nuisanceWeights } = LAND_VALUE;
  const positive = weights.green * parts.green + weights.services * parts.services + weights.leisure * parts.leisure + weights.access * parts.access;
  const nuisance = nuisanceWeights.pollution * parts.pollution + nuisanceWeights.odor * parts.odor + nuisanceWeights.congestion * parts.congestion;
  return LAND_VALUE.max * positive * (1 - LAND_VALUE.maxNuisanceCut * nuisance);
}

// How desirable a tile is for a Home standing on it, from 0 to 100: display only, nothing reads it.
export function landValueField(state: GameState): TileField {
  const cached = cache.get(state);
  if (cached) return cached;
  const field = buildTileField(state, (x, y) => landValueOf(landValuePartsAt(state, x, y)), LAND_VALUE.max);
  cache.set(state, field);
  return field;
}
