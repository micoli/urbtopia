import { footprintTiles } from '../buildings/buildingSpecs';
import { roundaboutTiles } from '../map/occupancy';
import { bridgeFootprint } from '../water/bridgeGeometry';
import { bridgesOf } from '../water/bridges';
import type { Coord } from '../map/coord';
import type { Boat, Building, GameState, Stash } from '../engine/state';
import { layoutOf } from './layout';
import { liftBridge } from './stashWater';

// The rectangle the player draws, corners included, in either order.
export interface ReplanArea {
  readonly from: Coord;
  readonly to: Coord;
}

function insideOf(area: ReplanArea | undefined): (tile: Coord) => boolean {
  if (!area) return () => true;
  const [x0, x1] = [Math.min(area.from.x, area.to.x), Math.max(area.from.x, area.to.x)];
  const [y0, y1] = [Math.min(area.from.y, area.to.y), Math.max(area.from.y, area.to.y)];
  return (tile) => tile.x >= x0 && tile.x <= x1 && tile.y >= y0 && tile.y <= y1;
}

const split = <T>(items: readonly T[] | undefined, lifted: (item: T) => boolean): { lifted: T[]; kept: T[] } => ({
  lifted: (items ?? []).filter(lifted),
  kept: (items ?? []).filter((item) => !lifted(item)),
});

// The Buildings the zone touches, and with them what cannot stay without them: the Boats of a Marina or Pirate cove, the Stands of a Pirate cove.
function liftedBuildingsOf(state: GameState, inside: (tile: Coord) => boolean): Set<number> {
  const ids = new Set(state.buildings.filter((building) => footprintTiles(building).some(inside)).map((building) => building.id));
  for (const building of state.buildings) if (building.coveId !== undefined && ids.has(building.coveId)) ids.add(building.id);
  return ids;
}

// Lifts what the zone holds on every Level (the whole map when there is no zone) and leaves the rest where it is.
export function liftZone(state: GameState, area?: ReplanArea): GameState | null {
  const inside = insideOf(area);
  const unbridged = bridgesOf(state)
    .filter((bridge) => bridgeFootprint(bridge).some(inside))
    .reduce<GameState>((current, bridge) => {
      const lifted = liftBridge(current, bridge);
      return 'state' in lifted ? lifted.state : current;
    }, state);
  const buildingIds = liftedBuildingsOf(unbridged, inside);
  const buildings = split<Building>(unbridged.buildings, (building) => buildingIds.has(building.id));
  const boats = split<Boat>(unbridged.boats, (boat) => inside(boat) || buildingIds.has(boat.marinaId));
  const roads = split(unbridged.roads, inside);
  const pedestrianWays = split(unbridged.pedestrianWays, inside);
  const walkways = split(unbridged.walkways, inside);
  const pedestrianAccesses = split(unbridged.pedestrianAccesses, inside);
  const waterTiles = split(unbridged.waterTiles, inside);
  const fields = split(unbridged.fields, inside);
  const roundabouts = split(unbridged.roundabouts, (center) => roundaboutTiles(center).some(inside));
  const brtRoads = split(unbridged.brtRoads, inside);
  const rails = split(unbridged.rails, inside);
  const tunnels = split(unbridged.tunnels, inside);
  const stash: Stash = {
    buildings: buildings.lifted, roads: roads.lifted, pedestrianWays: pedestrianWays.lifted, walkways: walkways.lifted, pedestrianAccesses: pedestrianAccesses.lifted,
    waterTiles: waterTiles.lifted, fields: fields.lifted, roundabouts: roundabouts.lifted, brtRoads: brtRoads.lifted, rails: rails.lifted, tunnels: tunnels.lifted,
    bridges: unbridged.replan?.stash.bridges ?? [], boats: boats.lifted,
  };
  if (Object.values(stash).every((list) => list.length === 0)) return null;
  const lines = withoutStopReferences(unbridged, buildingIds);
  return {
    ...lines,
    buildings: buildings.kept, roads: roads.kept, pedestrianWays: pedestrianWays.kept, walkways: walkways.kept, pedestrianAccesses: pedestrianAccesses.kept,
    waterTiles: waterTiles.kept, fields: fields.kept, roundabouts: roundabouts.kept, brtRoads: brtRoads.kept, rails: rails.kept, tunnels: tunnels.kept, boats: boats.kept,
    replan: { stash, start: layoutOf(state) },
  };
}

// The lines stay: only the references to stops that went into the Stash are taken out. A line left with fewer than two stops cannot exist and goes, its vehicles unassigned.
function withoutStopReferences(state: GameState, stopIds: ReadonlySet<number>): GameState {
  const trim = <T extends { id: number; stops: number[]; loop?: boolean }>(line: T): T | null => {
    const stops = line.stops.filter((stop) => !stopIds.has(stop));
    if (stops.length === line.stops.length) return line;
    if (stops.length < 2) return null;
    const { loop, ...rest } = line;
    return { ...rest, stops, ...(loop && stops.length >= 3 ? { loop } : {}) } as T;
  };
  const buses = (state.busLines ?? []).flatMap((line) => trim(line) ?? []);
  const transit = (state.transitLines ?? []).flatMap((line) => trim(line) ?? []);
  const kept = new Set([...buses, ...transit].map((line) => line.id));
  return {
    ...state,
    busLines: buses,
    transitLines: transit,
    transitFleet: (state.transitFleet ?? []).map(({ lineId, ...vehicle }) => (lineId === undefined || kept.has(lineId) ? { ...vehicle, ...(lineId !== undefined ? { lineId } : {}) } : vehicle)),
  };
}
