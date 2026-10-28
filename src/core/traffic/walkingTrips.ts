import type { Building, GameState } from '../engine/state';
import { adjacentNodes, crossingsOnPath, nearestTarget, nodesOnPath, type PedestrianGraph, type WalkMap } from '../map/pedestrianGraph';
import { WALKING, WALK_DESTINATIONS, walkAccessOf, walkDestinationOf, type WalkDestination } from './walking';

export interface WalkDestinationSite {
  id: number;
  kind: WalkDestination;
  sidewalks: string[];
}

export type WalkingTrips = Record<WalkDestination, number>;

export function emptyTrips(): WalkingTrips {
  return { shop: 0, school: 0, health: 0, culture: 0, casino: 0, park: 0, townHall: 0 };
}

export function walkDestinations(state: GameState, graph: PedestrianGraph): WalkDestinationSite[] {
  const sites: WalkDestinationSite[] = [];
  for (const building of state.buildings as Building[]) {
    const kind = walkDestinationOf(building);
    if (kind === null) continue;
    const sidewalks = adjacentNodes(state, graph, building);
    if (sidewalks.length > 0) sites.push({ id: building.id, kind, sidewalks });
  }
  return sites.sort((a, b) => a.id - b.id);
}

export function walkServices(walk: WalkMap, sites: readonly WalkDestinationSite[], citizens: number, pedestrians: Map<string, number>, walkingTotals: WalkingTrips, cyclingTotals: WalkingTrips, sidewalkLoads: Map<string, number> = new Map(), arrivals: Map<number, number> = new Map(), onWalk: (site: number, count: number, nodes: string[]) => void = () => undefined): number {
  const trips = new Map<WalkDestination, number>();
  for (const kind of WALK_DESTINATIONS) {
    let best: { node: string; cost: number; site: number } | null = null;
    for (const site of sites) {
      if (site.kind !== kind) continue;
      const target = nearestTarget(walk, site.sidewalks);
      if (target === null || target.cost > WALKING.thresholds[kind] * WALKING.cyclingFactor) continue;
      if (best === null || target.cost < best.cost) best = { ...target, site: site.id };
    }
    if (best === null) continue;
    const count = citizens * WALKING.tripsPerCitizen[kind];
    trips.set(kind, count);
    (best.cost <= WALKING.thresholds[kind] ? walkingTotals : cyclingTotals)[kind] += count;
    const nodes = nodesOnPath(walk, best.node);
    if (best.cost <= WALKING.thresholds[kind]) {
      arrivals.set(best.site, (arrivals.get(best.site) ?? 0) + count);
      onWalk(best.site, count, nodes);
    }
    for (const crossing of crossingsOnPath(walk, best.node)) pedestrians.set(crossing, (pedestrians.get(crossing) ?? 0) + count);
    for (const node of nodes) sidewalkLoads.set(node, (sidewalkLoads.get(node) ?? 0) + count);
  }
  return walkAccessOf(trips, citizens);
}
