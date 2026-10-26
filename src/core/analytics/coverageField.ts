import { centerOf } from '../environment/ecology';
import { FACILITIES, facilitiesOfCategory, isWithinReach, type ServiceCategory } from '../services/facilities';
import type { Building, GameState } from '../engine/state';
import { GAME_CONFIG } from '../engine/config';
import { MAP_TILES, type TileField } from './tileField';

const cache = new WeakMap<GameState, Map<ServiceCategory, TileField>>();

export const COVERAGE_TILE = { uncovered: 0, covered: 1 } as const;

// Whether a Home standing on each tile of the owned Parcels would be within reach of a facility of the category.
// Capacity and transit are left to the Homes already built, which are tinted on top.
export function coverageField(state: GameState, category: ServiceCategory): TileField {
  const perCategory = cache.get(state) ?? new Map<ServiceCategory, TileField>();
  cache.set(state, perCategory);
  const cached = perCategory.get(category);
  if (cached) return cached;
  const types = new Set<string>(facilitiesOfCategory(category));
  const facilities = state.buildings.filter((building: Building) => types.has(building.type));
  const values = new Float32Array(MAP_TILES * MAP_TILES).fill(NaN);
  const side = GAME_CONFIG.parcelSizeInTiles;
  const reaches = (facility: Building, x: number, y: number) => {
    const { radius } = FACILITIES[facility.type as keyof typeof FACILITIES];
    if (radius === null) return true;
    const from = centerOf(facility);
    return isWithinReach(x + 0.5 - from.x, y + 0.5 - from.y, radius);
  };
  for (const parcel of state.ownedParcels) {
    for (let y = parcel.y * side; y < (parcel.y + 1) * side; y++) {
      for (let x = parcel.x * side; x < (parcel.x + 1) * side; x++) {
        values[y * MAP_TILES + x] = facilities.some(facility => reaches(facility, x, y)) ? COVERAGE_TILE.covered : COVERAGE_TILE.uncovered;
      }
    }
  }
  const field: TileField = { size: MAP_TILES, values, max: 1, paintsZero: true };
  perCategory.set(category, field);
  return field;
}
