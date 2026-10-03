import { totalCitizens } from './city';
import { FACILITIES, FACILITY_TYPES, type FacilityType } from './facilities';
import { GOODS, MATERIALS, unlockCitizensOf, type ItemId } from './items';
import type { GameState } from './state';

export interface Unlock {
  citizens: number;
  items: ItemId[];
}

const ALL_ITEMS: ItemId[] = [...(Object.keys(MATERIALS) as ItemId[]), ...(Object.keys(GOODS) as ItemId[])];

export function isItemUnlocked(state: GameState, item: ItemId): boolean {
  return totalCitizens(state) >= unlockCitizensOf(item);
}

export function nextUnlock(state: GameState): Unlock | null {
  const citizens = totalCitizens(state);
  const thresholds = [...new Set(ALL_ITEMS.map(unlockCitizensOf))].filter((threshold) => threshold > citizens).sort((a, b) => a - b);
  const next = thresholds[0];
  if (next === undefined) return null;
  return { citizens: next, items: ALL_ITEMS.filter((item) => unlockCitizensOf(item) === next) };
}

export function facilitiesUnlockedBetween(before: GameState, after: GameState): FacilityType[] {
  const from = totalCitizens(before);
  const to = totalCitizens(after);
  return FACILITY_TYPES.filter(type => FACILITIES[type].unlockCitizens > from && FACILITIES[type].unlockCitizens <= to);
}
