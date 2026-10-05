const COMMUTERS_PER_VEHICLE = 10;
const LANE_TILES_PER_VEHICLE = 2;
const MAX_VEHICLES = 150;

export interface TrafficTargetInput {
  commuters: number;
  laneTiles: number;
  touch: boolean;
}

export function targetVehicleCount({ commuters, laneTiles, touch }: TrafficTargetInput): number {
  const ceiling = touch ? MAX_VEHICLES / 2 : MAX_VEHICLES;
  return Math.min(Math.floor(commuters / COMMUTERS_PER_VEHICLE), Math.floor(laneTiles / LANE_TILES_PER_VEHICLE), ceiling);
}
