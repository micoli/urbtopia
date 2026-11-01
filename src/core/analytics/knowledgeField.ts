import { createBuilding } from '../buildings/buildingSpecs';
import { centerOf } from '../environment/ecology';
import { FACILITIES, FACILITY_TYPES, facilityRadius, isWithinReach, type FacilityType } from '../services/facilities';
import { homeKnowledge } from '../services/knowledge';
import type { Building, GameState } from '../engine/state';
import { buildTileField, type TileField } from './tileField';

const HYPOTHETICAL_HOME = -1;
const KNOWLEDGE_MAX = 100;

const cache = new WeakMap<GameState, TileField>();

// The Knowledge a Home standing on each tile would have. Schools and Libraries count when they reach the tile, whatever their capacity.
export function knowledgeField(state: GameState): TileField {
  const cached = cache.get(state);
  if (cached) return cached;
  const facilities = state.buildings.filter(building => FACILITY_TYPES.includes(building.type as FacilityType) && FACILITIES[building.type as FacilityType].category === 'education');
  const home = createBuilding(HYPOTHETICAL_HOME, 'home', 0, 0, 0);
  const field = buildTileField(state, (x, y) => {
    const reaching = facilities.filter(facility => {
      const radius = facilityRadius(facility.type as FacilityType, facility.tier);
      const from = centerOf(facility as Building);
      return radius === null || isWithinReach(x + 0.5 - from.x, y + 0.5 - from.y, radius);
    });
    const coverage = new Map([[HYPOTHETICAL_HOME, new Set(reaching.map(facility => facility.type as FacilityType))]]);
    const libraryTier = Math.max(0, ...reaching.filter(facility => facility.type === 'library').map(facility => facility.tier));
    return homeKnowledge(state, home, coverage, new Map([[HYPOTHETICAL_HOME, new Map([['library' as FacilityType, libraryTier]])]]));
  }, KNOWLEDGE_MAX);
  cache.set(state, field);
  return field;
}
