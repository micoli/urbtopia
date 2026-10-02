import type { Coord } from './coord';
import type { ItemId, MaterialId } from './items';
import type { RoadKind } from './roads';

export type BuildingType = 'workshop' | 'factory' | 'shop' | 'storehouse' | 'home' | 'powerPlant' | 'waterTower';

export type Rotation = 0 | 1 | 2 | 3;

export type ParcelCoord = Coord;

export interface QueueEntry {
  item: ItemId;
  duration: number;
  startedAt: number | null;
  done: boolean;
}

export interface Building extends Coord {
  id: number;
  type: BuildingType;
  rotation: Rotation;
  slotCount: number;
  queue: QueueEntry[];
}

export interface Storage {
  materials: Partial<Record<MaterialId, number>>;
  goods: Partial<Record<string, number>>;
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
  storage: Storage;
  roads: RoadTile[];
  roundabouts: Coord[];
}
