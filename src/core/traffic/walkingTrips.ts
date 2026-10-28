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
    const reachable = sites.flatMap(site => {
      const target = site.kind === kind ? nearestTarget(walk, site.sidewalks) : null;
      return target !== null && target.cost <= WALKING.thresholds[kind] * WALKING.cyclingFactor ? [{ ...target, site: site.id }] : [];
    });
    // Every destination within walking range shares the trips; beyond it, the nearest one takes them by bicycle.
    const walkable = reachable.filter(candidate => candidate.cost <= WALKING.thresholds[kind]);
    const chosen = walkable.length > 0 ? walkable : reachable.sort((a, b) => a.cost - b.cost).slice(0, 1);
    if (chosen.length === 0) continue;
    const total = citizens * WALKING.tripsPerCitizen[kind];
    trips.set(kind, total);
    const count = total / chosen.length;
    for (const target of chosen) {
      const nodes = nodesOnPath(walk, target.node);
      if (target.cost <= WALKING.thresholds[kind]) {
        walkingTotals[kind] += count;
        arrivals.set(target.site, (arrivals.get(target.site) ?? 0) + count);
        onWalk(target.site, count, nodes);
      } else cyclingTotals[kind] += count;
      for (const crossing of crossingsOnPath(walk, target.node)) pedestrians.set(crossing, (pedestrians.get(crossing) ?? 0) + count);
      for (const node of nodes) sidewalkLoads.set(node, (sidewalkLoads.get(node) ?? 0) + count);
    }
  }
  return walkAccessOf(trips, citizens);
}
