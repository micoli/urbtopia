import { footprintOf } from '../buildings/buildingSpecs';
import { isHomeType } from '../buildings/buildingDefinitions';
import { homeBenefits } from '../environment/wellbeing';
import { serviceCoverage, transitReachLinks } from '../services/services';
import { facilitiesOfCategory, type ServiceCategory } from '../services/facilities';
import { isWasteCovered, wasteReport } from '../waste/waste';
import type { Building, GameState } from '../engine/state';
import type { AnalyticsLayerId } from './layers';
import type { RampId } from './scales';

export interface HomeTint {
  x: number;
  y: number;
  width: number;
  depth: number;
  ramp: RampId;
  // 0 to 1 along the ramp.
  share: number;
}

// Discrete coverage reads at the three stops of its ramp.
export const COVERAGE_SHARE = { uncovered: 0, viaTransit: 0.5, covered: 1 } as const;

function tintOf(home: Building, ramp: RampId, share: number): HomeTint {
  const { width, depth } = footprintOf(home.type, home.rotation, home.tier);
  return { x: home.x, y: home.y, width, depth, ramp, share };
}

function coverageTints(state: GameState, category: ServiceCategory, homes: readonly Building[]): HomeTint[] {
  if (category === 'waste') {
    const report = wasteReport(state);
    return homes.map(home => tintOf(home, 'coverage', isWasteCovered(report, home.id) ? COVERAGE_SHARE.covered : COVERAGE_SHARE.uncovered));
  }
  const coverage = serviceCoverage(state);
  const links = transitReachLinks(state);
  const types = facilitiesOfCategory(category);
  return homes.map(home => {
    const covering = types.filter(type => coverage.get(home.id)?.has(type));
    if (covering.length === 0) return tintOf(home, 'coverage', COVERAGE_SHARE.uncovered);
    const onlyByTransit = covering.every(type => links.get(home.id)?.has(type));
    return tintOf(home, 'coverage', onlyByTransit ? COVERAGE_SHARE.viaTransit : COVERAGE_SHARE.covered);
  });
}

// Layers that tint each Home instead of every tile.
export function homeTintsOf(state: GameState, layer: AnalyticsLayerId, category: ServiceCategory): HomeTint[] {
  const homes = state.buildings.filter(building => isHomeType(building.type));
  if (layer === 'data.coverage') return coverageTints(state, category, homes);
  if (layer === 'data.wellbeing') return homes.map(home => tintOf(home, 'wellbeing', Math.min(1, Math.max(0, homeBenefits(state, home).wellbeing / 100))));
  return [];
}
