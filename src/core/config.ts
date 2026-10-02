export const GAME_CONFIG = {
  mapSizeInParcels: 8,
  parcelSizeInTiles: 16,
  startingUrbs: 600,
  startingParcels: [
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 3, y: 4 },
    { x: 4, y: 4 },
  ],
  startingBuildings: [
    { type: 'workshop', x: 54, y: 56 },
    { type: 'factory', x: 60, y: 56 },
  ],
  offlineCapMs: 48 * 60 * 60 * 1000,
} as const;
