import type { Building, GameState } from '../engine/state';
import { adjacentNodes, crossingsOnPath, nearestTarget, type PedestrianGraph, type WalkMap } from '../map/pedestrianGraph';
import { WALKING, WALK_DESTINATIONS, walkAccessOf, walkDestinationOf, type WalkDestination } from './walking';

export interface WalkDestinationSite {
  id: number;
  kind: WalkDestination;
  sidewalks: string[];
}

export type WalkingTrips = Record<WalkDestination, number>;

export function emptyTrips(): WalkingTrips {
  return { shop: 0, school: 0, health: 0, culture: 0, casino: 0, park: 0 };
}

export function walkDestinations(state: GameState, graph: PedestrianGraph): WalkDestinationSite[] {
  const sites: WalkDestinationSite[] = [];
  for (const building of state.buildings as Building[]) {
    const kind = walkDestinationOf(building);
    if (kind === null) continue;
    const sidewalks = adjacentNodes(graph, building);
    if (sidewalks.length > 0) sites.push({ id: building.id, kind, sidewalks });
  }
  return sites.sort((a, b) => a.id - b.id);
}

export function walkServices(walk: WalkMap, sites: readonly WalkDestinationSite[], citizens: number, pedestrians: Map<string, number>, totals: WalkingTrips): number {
  const trips = new Map<WalkDestination, number>();
  for (const kind of WALK_DESTINATIONS) {
    let best: { node: string; cost: number } | null = null;
    for (const site of sites) {
      if (site.kind !== kind) continue;
      const target = nearestTarget(walk, site.sidewalks);
      if (target === null || target.cost > WALKING.thresholds[kind]) continue;
      if (best === null || target.cost < best.cost) best = target;
    }
    if (best === null) continue;
    const count = citizens * WALKING.tripsPerCitizen[kind];
    trips.set(kind, count);
    totals[kind] += count;
    for (const crossing of crossingsOnPath(walk, best.node)) pedestrians.set(crossing, (pedestrians.get(crossing) ?? 0) + count);
  }
  return walkAccessOf(trips, citizens);
}
