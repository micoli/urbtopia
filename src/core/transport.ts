import { ECOLOGY, citizenCount, distance } from './ecology';
import { HOME_TIERS } from './economy';
import { frontTiles } from './placement';
import { DIRECTIONS, neighbour, tileKey } from './geometry';
import { roundaboutTiles } from './occupancy';
import type { Building, BusLine, GameState } from './state';
import type { Coord } from './coord';

export function routeForLine(state: GameState, line: BusLine): Coord[] | null {
  if (line.stops.length < 2 || new Set(line.stops).size !== line.stops.length) return null;
  const roads = new Set(state.roads.map(tileKey));
  for (const center of state.roundabouts) for (const tile of roundaboutTiles(center)) {
    if (tile.x !== center.x || tile.y !== center.y) roads.add(tileKey(tile));
  }
  const endpoints: Coord[] = [];
  for (const id of line.stops) {
    const stop = state.buildings.find(b => b.id === id && b.type === 'busStop');
    if (!stop) return null;
    const road = frontTiles(stop.type, stop.x, stop.y, stop.rotation).find(p => roads.has(tileKey(p)));
    if (!road) return null;
    endpoints.push(road);
  }
  const route: Coord[] = [endpoints[0]!];
  for (let i = 1;i < endpoints.length;i++) {
    const path = roadRoute(roads, endpoints[i - 1]!, endpoints[i]!);
    if (!path) return null;
    route.push(...path.slice(1));
  }
  return route.length > 1 ? route : null;
}

function roadRoute(roads: Set<string>, from: Coord, to: Coord): Coord[] | null {
  const queue = [from], parents = new Map<string, Coord | null>([[tileKey(from), null]]);
  for (let i = 0;i < queue.length;i++) {
    const p = queue[i]!;
    if (tileKey(p) === tileKey(to)) {
      const path: Coord[] = []; let current: Coord | null = p;
      while (current) { path.unshift(current); current = parents.get(tileKey(current)) ?? null; }
      return path;
    }
    for (const d of DIRECTIONS) {
      const next = neighbour(p, d), key = tileKey(next);
      if (!roads.has(key) || parents.has(key)) continue;
      parents.set(key, p); queue.push(next);
    }
  }
  return null;
}

export function transportStats(state: GameState) {
  const homes = state.buildings.filter(b => b.type === 'home');
  const activities = state.buildings.filter(b => ['workshop', 'factory', 'shop'].includes(b.type));
  const allocated = new Map<number, number>();
  const lines = [...(state.busLines ?? [])].sort((a, b) => a.id - b.id).map(line => {
    const route = routeForLine(state, line);
    const stops = line.stops.map(id => state.buildings.find(b => b.id === id)).filter((b): b is Building => !!b);
    const usefulHomes = route ? homes.filter(home => stops.some((stop, i) => distance(home, stop) <= ECOLOGY.stopRadius && stops.some((other, j) => j !== i && activities.some(a => distance(a, other) <= ECOLOGY.stopRadius)))) : [];
    let riders = 0;
    if (route && state.urbs > 1e-9) for (const home of usefulHomes) {
      const eligible = (HOME_TIERS[home.tier - 1]?.citizens ?? 0) * 0.7;
      const amount = Math.max(0, Math.min(eligible - (allocated.get(home.id) ?? 0), ECOLOGY.lineCapacity - riders));
      riders += amount; allocated.set(home.id, (allocated.get(home.id) ?? 0) + amount);
    }
    return { ...line, route, riders, active: route !== null && state.urbs > 1e-9, homeIds: usefulHomes.map(h => h.id), covered: usefulHomes.reduce((n, h) => n + (HOME_TIERS[h.tier - 1]?.citizens ?? 0), 0) };
  });
  const coveredIds = new Set(lines.filter(l => l.route).flatMap(l => l.homeIds));
  const covered = homes.filter(h => coveredIds.has(h.id)).reduce((n, h) => n + (HOME_TIERS[h.tier - 1]?.citizens ?? 0), 0);
  const riders = [...allocated.values()].reduce((n, x) => n + x, 0), activeLines = lines.filter(l => l.active).length;
  return { lines, covered, riders, activeLines, costPerHour: activeLines * ECOLOGY.busCost, emissions: Math.max(0, citizenCount(state) - riders) / 10 + activeLines * 0.5 };
}
