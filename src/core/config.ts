import type { Coord } from './coord';
import type { BuildingType, Rotation } from './state';

interface StartingBuilding extends Coord {
  type: BuildingType;
  rotation: Rotation;
}

const startingParcels: Coord[] = [
  { x: 3, y: 3 },
  { x: 4, y: 3 },
  { x: 3, y: 4 },
  { x: 4, y: 4 },
];

const startingBuildings: StartingBuilding[] = [
  { type: 'workshop', x: 54, y: 56, rotation: 2 },
  { type: 'factory', x: 60, y: 56, rotation: 2 },
];

const startingRoadRow = { y: 58, fromX: 53, toX: 62 };

export const GAME_CONFIG = {
  mapSizeInParcels: 8,
  parcelSizeInTiles: 16,
  startingUrbs: 600,
  startingParcels,
  startingBuildings,
  startingRoadRow,
  firstEntityId: 1,
  roadCostPerTile: 2,
  crossingCost: 10,
  roundaboutCost: 40,
  roundaboutSize: 3,
  sellRefundRatio: 0.75,
  offlineCapMs: 48 * 60 * 60 * 1000,
  tutorial: { startingUrbs: 2000, startingWood: 10 },
};
