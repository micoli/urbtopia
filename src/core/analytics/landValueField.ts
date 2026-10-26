import { createBuilding } from '../buildings/buildingSpecs';
import { ECOLOGY, greenBenefits } from '../environment/ecology';
import { leisureRetention } from '../leisure/leisure';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import { FACILITIES, SERVICE_CATEGORIES, isWithinReach, type FacilityType } from '../services/facilities';
import { centerOf } from '../environment/ecology';
import { congestionStats } from '../traffic/congestion';
import { CONGESTION } from '../traffic/roadTier';
import type { Building, GameState } from '../engine/state';
import { odorField } from './odorField';
import { pollutionField } from './pollutionField';
import { MAP_TILES, buildTileField, fieldValueAt, type TileField } from './tileField';

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

// Writes `value` on every tile within `reach` (Chebyshev) of the source, keeping the highest.
function splat(grid: Float32Array, x: number, y: number, reach: number, value: number): void {
  for (let ty = Math.max(0, y - reach); ty <= Math.min(MAP_TILES - 1, y + reach); ty++) {
    for (let tx = Math.max(0, x - reach); tx <= Math.min(MAP_TILES - 1, x + reach); tx++) {
      const index = ty * MAP_TILES + tx;
      if (value > grid[index]!) grid[index] = value;
    }
  }
}

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

// How desirable a tile is for a Home standing on it, from 0 to 100: display only, nothing reads it.
export function landValueField(state: GameState): TileField {
  const cached = cache.get(state);
  if (cached) return cached;
  const pollution = pollutionField(state);
  const odor = odorField(state);
  const powered = poweredCasinoIds(state);
  const { roads, stops, jam } = accessGrids(state);
  const facilities = new Map<string, Building[]>();
  for (const building of state.buildings) {
    const spec = FACILITIES[building.type as FacilityType];
    if (spec) facilities.set(spec.category, [...(facilities.get(spec.category) ?? []), building]);
  }
  const { weights, nuisanceWeights } = LAND_VALUE;
  const field = buildTileField(state, (x, y) => {
    const home = createBuilding(0, 'home', x, y, 0);
    const index = y * MAP_TILES + x;
    const access = (roads[index]! * LAND_VALUE.roadShare) + (stops[index]! * (1 - LAND_VALUE.roadShare));
    const positive = weights.green * greenBenefits(state, home).wellbeing / 100
      + weights.services * servicesShare(facilities, home)
      + weights.leisure * clamp01((1 - leisureRetention(state, home, powered, 100)) / LAND_VALUE.leisureSaturation)
      + weights.access * access;
    const nuisance = nuisanceWeights.pollution * clamp01(fieldValueAt(pollution, x, y) / pollution.max)
      + nuisanceWeights.odor * clamp01(fieldValueAt(odor, x, y) / odor.max)
      + nuisanceWeights.congestion * jam[index]!;
    return LAND_VALUE.max * positive * (1 - LAND_VALUE.maxNuisanceCut * nuisance);
  }, LAND_VALUE.max);
  cache.set(state, field);
  return field;
}
