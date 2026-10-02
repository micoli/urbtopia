export type GameEvent =
  | { readonly type: 'RoadBuilt'; readonly tiles: number }
  | { readonly type: 'BuildingPlaced'; readonly id: number }
  | { readonly type: 'BuildingSold'; readonly id: number }
  | { readonly type: 'BuildingMoved'; readonly id: number };
