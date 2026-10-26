import { COAL_CAPACITY } from '../economy/economy';
import { isHomeType } from '../buildings/buildingDefinitions';
import { createBuilding, footprintTiles } from '../buildings/buildingSpecs';
import { diagnosisOf, type Cause } from '../diagnosis/diagnosis';
import { ECOLOGY, distance } from '../environment/ecology';
import { energyStats } from '../environment/energy';
import { homeBenefits } from '../environment/wellbeing';
import { facilitiesOfCategory, type ServiceCategory } from '../services/facilities';
import { serviceCoverage, uncoveredReason } from '../services/services';
import { congestionStats } from '../traffic/congestion';
import { MAX_ROAD_TIER } from '../traffic/roadTier';
import { WALKING } from '../traffic/walking';
import { wasteCauseOf, wasteReport } from '../waste/waste';
import { WASTE_FACILITIES, wasteKindOf } from '../waste/wasteBalance';
import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';
import type { Building, GameState } from '../engine/state';
import type { AnalyticsLayerId } from './layers';
import { LAND_VALUE, landValuePartsAt, type LandValueParts } from './landValueField';
import { layerFieldsOf } from './fields';
import { COVERAGE_SHARE, homeTintsOf } from './homeTints';
import { fieldValueAt } from './tileField';
import { LAYER_SCALES } from './scales';

export interface ProbeLine {
  // A message key for what is read.
  key: string;
  value: number | null;
  suffix?: string;
}

export interface Probe {
  lines: ProbeLine[];
  causes: readonly Cause[];
}

const cause = (key: string, weight: number, focus: readonly Coord[] = [], params: Cause['params'] = {}): Cause => ({ key, weight, params, focus });

const round = (value: number) => Math.round(value * 10) / 10;

function homeAt(state: GameState, tile: Coord): Building | null {
  return state.buildings.find(building => isHomeType(building.type) && footprintTiles(building).some(t => t.x === tile.x && t.y === tile.y)) ?? null;
}

function pollutionCauses(state: GameState, tile: Coord): Cause[] {
  const home = createBuilding(0, 'home', tile.x, tile.y, 0);
  const rates = energyStats(state).coalRates;
  const coal = state.buildings.filter(building => building.type === 'coalPlant' && distance(building, home) <= ECOLOGY.coalPollutionRadius);
  const smoke = coal.map(plant => ECOLOGY.coalWellbeingPenalty * (rates.get(plant.id) ?? 0) / (COAL_CAPACITY[plant.tier - 1] || 1) / ECOLOGY.coalWellbeingCap);
  const total = smoke.reduce((sum, share) => sum + share, 0);
  const causes = coal.length > 0 && total > 0 ? [cause('analytics.cause.coal', 1, [{ x: coal[0]!.x, y: coal[0]!.y }], { count: coal.length })] : [];
  const incinerators = state.buildings.filter(building => wasteKindOf(building.type) === 'incinerator');
  const report = wasteReport(state);
  const burning = incinerators.filter(building => (report.facilities.get(building.id)?.processed ?? 0) > 0 && distance(building, home) <= (WASTE_FACILITIES.incinerator.pollution?.radius ?? 0) + 2);
  return burning.length > 0 ? [...causes, cause('analytics.cause.incinerator', 0.5, [{ x: burning[0]!.x, y: burning[0]!.y }], { count: burning.length })] : causes;
}

function odorCauses(state: GameState, tile: Coord): Cause[] {
  const home = createBuilding(0, 'home', tile.x, tile.y, 0);
  const radius = WASTE_FACILITIES.mound.odor?.radius ?? 0;
  const mounds = state.buildings.filter(building => wasteKindOf(building.type) === 'mound' && distance(building, home) <= radius * 2);
  return mounds.length > 0 ? [cause('analytics.cause.mound', 1, [{ x: mounds[0]!.x, y: mounds[0]!.y }], { count: mounds.length })] : [];
}

function roadCauses(state: GameState, tile: Coord): Cause[] {
  const stats = congestionStats(state);
  const key = tileKey(tile);
  const section = stats.sections.get(key);
  const disconnected = stats.disconnectedSections.some(tiles => tiles.some(t => tileKey(t) === key));
  const causes: Cause[] = disconnected ? [cause('analytics.cause.disconnected', 1, [tile])] : [];
  if (!section) return causes;
  if (section.ratio > 1) causes.push(cause('analytics.cause.overCapacity', Math.min(1, section.ratio - 1), [tile], { load: Math.round(section.load), capacity: Math.round(section.capacity) }));
  const cut = stats.crossings.get(key)?.cut ?? 0;
  if (cut > 0) causes.push(cause('analytics.cause.crossingCut', cut / WALKING.maxCrossingCut, [tile], { pedestrians: Math.round(stats.crossings.get(key)!.pedestrians) }));
  const tier = state.roads.find(road => tileKey(road) === key)?.tier ?? 1;
  if (section.ratio > 1 && tier < MAX_ROAD_TIER) causes.push(cause('analytics.cause.laneTier', 0.1, [tile], { tier }));
  return causes;
}

function walkCauses(state: GameState, tile: Coord): Cause[] {
  const crossing = congestionStats(state).crossings.get(tileKey(tile));
  return crossing ? [cause('analytics.cause.crossingLoad', Math.max(0.1, crossing.cut / WALKING.maxCrossingCut), [tile], { pedestrians: Math.round(crossing.pedestrians) })] : [];
}

type Benefits = ReturnType<typeof homeBenefits>;

// Signed contributions to a Home's Well-being, in points.
const WELLBEING_PARTS: readonly (readonly [string, (benefits: Benefits) => number])[] = [
  ['analytics.cause.well.pollution', benefits => -benefits.pollutionPenalty],
  ['analytics.cause.well.odor', benefits => -benefits.odorPenalty],
  ['analytics.cause.well.services', benefits => -benefits.servicePenalty],
  ['analytics.cause.well.congestion', benefits => -benefits.congestionPenalty],
  ['analytics.cause.well.serviceBonus', benefits => benefits.serviceBonus],
  ['analytics.cause.well.walking', benefits => benefits.walkingBonus],
  ['analytics.cause.well.solidarity', benefits => benefits.solidarityBonus],
];

const WELLBEING_POINTS_FOR_FULL_WEIGHT = 25;

function wellbeingCauses(state: GameState, home: Building): Cause[] {
  const benefits = homeBenefits(state, home);
  const focus = [{ x: home.x, y: home.y }];
  return WELLBEING_PARTS.map(([key, amount]) => cause(key, Math.abs(amount(benefits)) / WELLBEING_POINTS_FOR_FULL_WEIGHT, focus, { amount: round(Math.abs(amount(benefits))) }));
}

function coverageCauses(state: GameState, home: Building, category: ServiceCategory): Cause[] {
  const focus = [{ x: home.x, y: home.y }];
  if (category === 'waste') {
    const reason = wasteCauseOf(wasteReport(state), home.id);
    return reason ? [cause(`analytics.cause.waste.${reason}`, 1, focus)] : [];
  }
  const types = facilitiesOfCategory(category);
  if (types.some(type => serviceCoverage(state).get(home.id)?.has(type))) return [];
  const built = types.filter(type => state.buildings.some(building => building.type === type));
  if (built.length === 0) return [cause('analytics.cause.noFacility', 1, focus)];
  return built.map(type => cause(`analytics.cause.${uncoveredReason(state, home, type)}`, 1, focus)).filter(entry => entry.key !== 'analytics.cause.none');
}

const LAND_PARTS: readonly [keyof LandValueParts, string, number][] = [
  ['green', 'analytics.cause.land.green', LAND_VALUE.weights.green],
  ['services', 'analytics.cause.land.services', LAND_VALUE.weights.services],
  ['leisure', 'analytics.cause.land.leisure', LAND_VALUE.weights.leisure],
  ['access', 'analytics.cause.land.access', LAND_VALUE.weights.access],
];
const LAND_NUISANCES: readonly [keyof LandValueParts, string, number][] = [
  ['pollution', 'analytics.cause.land.pollution', LAND_VALUE.nuisanceWeights.pollution],
  ['odor', 'analytics.cause.land.odor', LAND_VALUE.nuisanceWeights.odor],
  ['congestion', 'analytics.cause.land.congestion', LAND_VALUE.nuisanceWeights.congestion],
];

function landCauses(state: GameState, tile: Coord): Cause[] {
  const parts = landValuePartsAt(state, tile.x, tile.y);
  return [
    ...LAND_PARTS.map(([part, key, weight]) => cause(key, parts[part] * weight, [tile])),
    ...LAND_NUISANCES.map(([part, key, weight]) => cause(key, parts[part] * weight * LAND_VALUE.maxNuisanceCut, [tile])),
  ];
}

// What one tile of a Layer reads, and the main reasons for it; null when there is nothing to read there.
export function probeOf(state: GameState, layer: AnalyticsLayerId, category: ServiceCategory, tile: Coord): Probe | null {
  const scales = LAYER_SCALES[layer] ?? [];
  const fields = layerFieldsOf(state, layer, category);
  let tileCovered: boolean | null = null;
  const lines: ProbeLine[] = fields.flatMap(({ field }, index): ProbeLine[] => {
    if (field.paintsZero) {
      const raw = field.values[tile.y * field.size + tile.x]!;
      if (Number.isNaN(raw)) return [];
      if (layer !== 'data.coverage') return [{ key: `analytics.layer.${layer}`, value: round(raw), ...(scales[index]?.suffix ? { suffix: scales[index]!.suffix } : {}) }];
      tileCovered = raw > 0;
      return [{ key: tileCovered ? 'analytics.legend.covered' : 'analytics.legend.uncovered', value: null }];
    }
    const value = fieldValueAt(field, tile.x, tile.y);
    const key = layer.startsWith('data.') ? `analytics.layer.${layer}` : `analytics.legend.${scales[index]?.label ?? 'roads'}`;
    return value > 0 ? [{ key, value: round(value), ...(scales[index]?.suffix ? { suffix: scales[index]!.suffix } : {}) }] : [];
  });
  const home = homeAt(state, tile);
  const homeTints = home ? homeTintsOf(state, layer, category).find(tint => tint.x === home.x && tint.y === home.y) : undefined;
  if (home && homeTints) {
    if (layer === 'data.wellbeing') lines.splice(0, lines.length, { key: 'analytics.layer.data.wellbeing', value: round(homeBenefits(state, home).wellbeing) });
    if (layer === 'data.coverage') lines.splice(0, lines.length, { key: homeTints.share === COVERAGE_SHARE.covered ? 'analytics.legend.covered' : homeTints.share === COVERAGE_SHARE.viaTransit ? 'analytics.legend.viaTransit' : 'analytics.legend.uncovered', value: null });
  }
  if (lines.length === 0) return null;
  const causes = (() => {
    switch (layer) {
      case 'data.pollution': return pollutionCauses(state, tile);
      case 'data.odor': return odorCauses(state, tile);
      case 'data.congestion': case 'movement.cars': return roadCauses(state, tile);
      case 'movement.pedestrians': return walkCauses(state, tile);
      case 'movement.all': return [...roadCauses(state, tile), ...walkCauses(state, tile)];
      case 'data.wellbeing': return home ? wellbeingCauses(state, home) : [];
      case 'data.coverage': return home ? coverageCauses(state, home, category) : tileCovered === false ? coverageCauses(state, createBuilding(0, 'home', tile.x, tile.y, 0), category) : [];
      case 'data.landValue': return landCauses(state, tile);
    }
  })();
  return { lines, causes: diagnosisOf(causes).causes };
}
