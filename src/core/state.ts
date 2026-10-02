import type { Coord } from './coord';
import type { RoadKind } from './roads';

export type BuildingType = 'workshop' | 'factory' | 'shop' | 'storehouse' | 'home' | 'powerPlant' | 'waterTower';

export type Rotation = 0 | 1 | 2 | 3;

export type ParcelCoord = Coord;

export interface Building extends Coord {
  id: number;
  type: BuildingType;
  rotation: Rotation;
}

export interface RoadTile extends Coord {
  kind: RoadKind;
}

export interface GameState {
  seed: string;
  rngState: number;
  urbs: number;
  lastSeen: number;
  nextId: number;
  ownedParcels: ParcelCoord[];
  buildings: Building[];
  roads: RoadTile[];
  roundabouts: Coord[];
}
