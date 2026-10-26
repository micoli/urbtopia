import { createBuilding } from '../buildings/buildingSpecs';
import { centerOf } from '../environment/ecology';
import { energyStats } from '../environment/energy';
import { homeBenefits } from '../environment/wellbeing';
import { poweredCasinoIds } from '../leisure/poweredCasinos';
import { FACILITIES, FACILITY_TYPES, isWithinReach, type FacilityType } from '../services/facilities';
import { serviceCoverage } from '../services/services';
import { congestionStats } from '../traffic/congestion';
import type { Building, GameState } from '../engine/state';
import { buildTileField, type TileField } from './tileField';

const HYPOTHETICAL_HOME = -1;
const WELLBEING_MAX = 100;

const cache = new WeakMap<GameState, TileField>();

// The Well-being a Home standing on each tile would have. Public facilities count when they reach the tile, whatever
// their capacity; the Commute of the hypothetical Home and its Waste coverage are not simulated.
export function wellbeingField(state: GameState): TileField {
  const cached = cache.get(state);
  if (cached) return cached;
  const coalRates = energyStats(state).coalRates;
  const powered = poweredCasinoIds(state);
  const congestion = congestionStats(state);
  const coverage = new Map(serviceCoverage(state));
  const facilities = state.buildings.filter(building => FACILITY_TYPES.includes(building.type as FacilityType) && FACILITIES[building.type as FacilityType].category !== 'waste');
  const reaching = (x: number, y: number): Set<FacilityType> => {
    const types = new Set<FacilityType>();
    for (const facility of facilities) {
      const { radius } = FACILITIES[facility.type as FacilityType];
      const from = centerOf(facility as Building);
      if (radius === null || isWithinReach(x + 0.5 - from.x, y + 0.5 - from.y, radius)) types.add(facility.type as FacilityType);
    }
    return types;
  };
  const field = buildTileField(state, (x, y) => {
    coverage.set(HYPOTHETICAL_HOME, reaching(x, y));
    const home = createBuilding(HYPOTHETICAL_HOME, 'home', x, y, 0);
    return Math.min(WELLBEING_MAX, Math.max(0, homeBenefits(state, home, coalRates, coverage, powered, congestion).wellbeing));
  }, WELLBEING_MAX);
  cache.set(state, field);
  return field;
}
