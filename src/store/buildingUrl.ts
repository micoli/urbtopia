import { hasProductionInterior, hasServiceInterior, isHomeInteriorUnlocked, isHomeType, isInteriorUnlocked, isVenue, type Building, type GameState } from '../core';
import { gameStore } from './gameStore';
import { sceneHandle } from './sceneHandle';
import { uiStore } from './uiStore';
import { venueStore } from './venueStore';

export interface BuildingTarget {
  buildingId: number | null;
  interior: boolean;
}

// `?building=12` selects the building with that id; `&interior` opens its interior as well, when it has one.
export function readBuildingTarget(search: string): BuildingTarget {
  const params = new URLSearchParams(search);
  const raw = params.get('building');
  const id = raw === null || raw.trim() === '' ? NaN : Number(raw);
  const interior = params.has('interior') && !['0', 'false'].includes(params.get('interior')!.trim().toLowerCase());
  return { buildingId: Number.isInteger(id) && id >= 0 ? id : null, interior };
}

export function writeBuildingTarget(search: string, target: BuildingTarget): string {
  const params = new URLSearchParams(search);
  if (target.buildingId === null) {
    params.delete('building');
    params.delete('interior');
  } else {
    params.set('building', String(target.buildingId));
    if (target.interior) params.set('interior', '');
    else params.delete('interior');
  }
  const written = params.toString();
  return written === '' ? '' : `?${written}`;
}

// Whether the player could open the interior of this building from its panel: a Venue, a Home once furnishing is unlocked, a Production or Service interior once its Citizens threshold is reached.
export function canOpenInterior(state: GameState, building: Building): boolean {
  if (isVenue(building)) return true;
  if (isHomeType(building.type)) return isHomeInteriorUnlocked(state);
  return (hasProductionInterior(building) || hasServiceInterior(building)) && isInteriorUnlocked(state, building.type);
}

// Selects the building named by the URL, opens its interior if the URL asks for it, and centres the view on it when the URL gives no position. A building that is not on the map leaves everything as it was.
export function applyBuildingTarget(search: string): void {
  const { buildingId, interior } = readBuildingTarget(search);
  if (buildingId === null) return;
  const state = gameStore.getState().state;
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building) return;
  uiStore.getState().select(building.id);
  if (interior && canOpenInterior(state, building)) venueStore.getState().open(building.id);
  const params = new URLSearchParams(search);
  if (!params.has('x') && !params.has('z')) sceneHandle.current?.focusOnTile(building);
}

// What the URL says now: the interior that is open, or else the building that is selected.
export function currentBuildingTarget(): BuildingTarget {
  const venueId = venueStore.getState().venueId;
  if (venueId !== null) return { buildingId: venueId, interior: true };
  return { buildingId: uiStore.getState().selectedBuildingId, interior: false };
}
