import { GAME_CONFIG } from './config';
import { PARCEL_PRICING } from './economy';
import type { GameState, ParcelCoord } from './state';

export function parcelPrice(state: GameState): number {
  const bought = state.ownedParcels.length - GAME_CONFIG.startingParcels.length;
  return Math.round((PARCEL_PRICING.base * PARCEL_PRICING.factor ** bought) / PARCEL_PRICING.roundTo) * PARCEL_PRICING.roundTo;
}

export function isInsideMap(parcel: ParcelCoord): boolean {
  const size = GAME_CONFIG.mapSizeInParcels;
  return parcel.x >= 0 && parcel.y >= 0 && parcel.x < size && parcel.y < size;
}

export function isOwned(state: GameState, parcel: ParcelCoord): boolean {
  return state.ownedParcels.some((owned) => owned.x === parcel.x && owned.y === parcel.y);
}

export function isAdjacentToOwned(state: GameState, parcel: ParcelCoord): boolean {
  return state.ownedParcels.some((owned) => Math.abs(owned.x - parcel.x) + Math.abs(owned.y - parcel.y) === 1);
}

export function buyableParcels(state: GameState): ParcelCoord[] {
  const size = GAME_CONFIG.mapSizeInParcels;
  const parcels: ParcelCoord[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const parcel = { x, y };
      if (!isOwned(state, parcel) && isAdjacentToOwned(state, parcel)) parcels.push(parcel);
    }
  }
  return parcels;
}
