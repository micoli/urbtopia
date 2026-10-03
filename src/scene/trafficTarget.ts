const CITIZENS_PER_VEHICLE = 10;
const ROAD_TILES_PER_VEHICLE = 2;
const MAX_VEHICLES = 150;

export interface TrafficTargetInput {
  citizens: number;
  roadTiles: number;
  touch: boolean;
}

export function targetVehicleCount({ citizens, roadTiles, touch }: TrafficTargetInput): number {
  const ceiling = touch ? MAX_VEHICLES / 2 : MAX_VEHICLES;
  return Math.min(Math.floor(citizens / CITIZENS_PER_VEHICLE), Math.floor(roadTiles / ROAD_TILES_PER_VEHICLE), ceiling);
}
