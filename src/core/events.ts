import type { ItemId } from './items';

export type GameEvent =
  | { readonly type: 'RoadBuilt'; readonly tiles: number }
  | { readonly type: 'BuildingPlaced'; readonly id: number }
  | { readonly type: 'BuildingSold'; readonly id: number }
  | { readonly type: 'BuildingMoved'; readonly id: number }
  | { readonly type: 'ProductionCompleted'; readonly buildingId: number; readonly item: ItemId; readonly at: number }
  | { readonly type: 'ItemsCollected'; readonly buildingId: number }
  | { readonly type: 'BuildingUpgraded'; readonly buildingId: number; readonly tier: number }
  | { readonly type: 'OfflineTimeCapped'; readonly forfeitedMs: number }
  | { readonly type: 'StorageFull'; readonly buildingId: number };
