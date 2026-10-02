import type { Coord } from './coord';

export type BuildingType = 'workshop' | 'factory';

export type ParcelCoord = Coord;

export interface Building extends Coord {
  id: number;
  type: BuildingType;
  rotation: 0 | 1 | 2 | 3;
}

export interface GameState {
  seed: string;
  rngState: number;
  urbs: number;
  lastSeen: number;
  nextId: number;
  ownedParcels: ParcelCoord[];
  buildings: Building[];
}
