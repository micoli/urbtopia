import { totalCitizens } from '../buildings/city';
import { isRetired } from '../buildings/buildingDefinitions';
import { FACILITIES, FACILITY_TYPES, type FacilityType } from '../services/facilities';
import { GOODS, MATERIALS, unlockCitizensOf, type ItemId } from '../economy/items';
import { CASINO } from '../leisure/casino';
import { SPORT_VENUES, SPORT_VENUE_TYPES, type SportVenueType } from '../leisure/sportVenues';
import type { CropId } from '../farming/crops';
import type { GameState } from '../engine/state';

export interface Unlock {
  citizens: number;
  items: ItemId[];
}

const ALL_ITEMS: ItemId[] = [...(Object.keys(MATERIALS) as ItemId[]), ...(Object.keys(GOODS) as ItemId[])];

export function isItemUnlocked(state: GameState, item: ItemId): boolean {
  return totalCitizens(state) >= unlockCitizensOf(item);
}

export function isCropUnlocked(state: GameState, crop: CropId): boolean {
  return isItemUnlocked(state, crop);
}

export function nextUnlock(state: GameState): Unlock | null {
  const citizens = totalCitizens(state);
  const thresholds = [...new Set(ALL_ITEMS.map(unlockCitizensOf))].filter((threshold) => threshold > citizens).sort((a, b) => a - b);
  const next = thresholds[0];
  if (next === undefined) return null;
  return { citizens: next, items: ALL_ITEMS.filter((item) => unlockCitizensOf(item) === next) };
}

export function facilitiesUnlockedBetween(before: GameState, after: GameState): (FacilityType | 'casino' | SportVenueType)[] {
  const from = totalCitizens(before);
  const to = totalCitizens(after);
  const unlocked = (threshold: number) => threshold > from && threshold <= to;
  return [
    ...FACILITY_TYPES.filter(type => unlocked(FACILITIES[type].unlockCitizens)),
    ...(unlocked(CASINO.unlockCitizens) ? ['casino' as const] : []),
    ...SPORT_VENUE_TYPES.filter(type => unlocked(SPORT_VENUES[type].unlockCitizens)),
  ].filter(type => !isRetired(type));
}
