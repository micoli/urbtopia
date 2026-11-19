import { isPlanningOffice, type Building } from '../core';
import { districtStore } from './districtStore';
import { venueStore } from './venueStore';

// What the interior tool opens: the District plan for a Planning office, the room of the building otherwise.
export function openInterior(building: Building): void {
  if (isPlanningOffice(building)) districtStore.getState().open(building.id);
  else venueStore.getState().open(building.id);
}
