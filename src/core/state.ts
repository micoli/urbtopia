import type { Coord } from './coord';
import type { GoodId, ItemId, MaterialId } from './items';
import type { RoadKind } from './roads';
import type { TutorialStep } from './tutorial';

export type BuildingType = 'workshop' | 'factory' | 'shop' | 'storehouse' | 'home' | 'powerPlant' | 'waterTower' | 'silo' | 'vault';

export type Rotation = 0 | 1 | 2 | 3;

export type ParcelCoord = Coord;

export interface QueueEntry {
  item: ItemId;
  duration: number;
  startedAt: number | null;
  done: boolean;
  quantity: number;
}

export interface ShopStack {
  good: GoodId | null;
  stock: number;
  nextSaleAt: number | null;
  earned: number;
}

export interface MarketPrice {
  points: number;
  updatedAt: number;
}

export interface Building extends Coord {
  id: number;
  type: BuildingType;
  rotation: Rotation;
  slotCount: number;
  queue: QueueEntry[];
  stacks: ShopStack[];
  tier: number;
  taxCitizenMs: number;
}

export interface Storage {
  materials: Partial<Record<MaterialId, number>>;
  goods: Partial<Record<GoodId, number>>;
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
  marketUnlocked: boolean;
  market: Partial<Record<GoodId, MarketPrice>>;
  roads: RoadTile[];
  roundabouts: Coord[];
  tutorial: TutorialStep | null;
}
