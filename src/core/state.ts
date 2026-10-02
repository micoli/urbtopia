export type BuildingType = 'workshop' | 'factory';

export interface Building {
  id: number;
  type: BuildingType;
  x: number;
  y: number;
  rotation: 0 | 1 | 2 | 3;
}

export interface ParcelCoord {
  x: number;
  y: number;
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
