import { ECOLOGY } from './ecology';
import { DIRECTIONS, neighbour, tileKey } from './geometry';
import { roundaboutTiles } from './occupancy';
import { frontTiles } from './placement';
import { networkNeighbours, networkTiles, TRANSIT } from './transitNetwork';
import type { Coord } from './coord';
import type { BusLine, GameState, TransitLine, TransitMode } from './state';

const routeCache = new WeakMap<GameState, Map<BusLine, { route: Coord[]; offsets: number[] } | null>>();

export function routeDetails(state: GameState, line: BusLine | TransitLine): { route: Coord[]; offsets: number[] } | null {
  let cache = routeCache.get(state);
  if (!cache) { cache = new Map(); routeCache.set(state, cache); }
  if (cache.has(line)) return cache.get(line)!;
  const result = resolveRoute(state, line); cache.set(line, result);
  return result;
}

function resolveRoute(state: GameState, line: BusLine | TransitLine): { route: Coord[]; offsets: number[] } | null {
  if (line.stops.length < 2 || new Set(line.stops).size !== line.stops.length) return null;
  const mode = 'mode' in line ? line.mode : 'bus';
  const roads = new Set(state.roads.map(tileKey));
  for (const center of state.roundabouts) for (const p of roundaboutTiles(center)) if (p.x !== center.x || p.y !== center.y) roads.add(tileKey(p));
  const tiles = mode === 'bus' ? [] : networkTiles(state, mode);
  const keys = mode === 'bus' ? roads : new Set(tiles.map(tileKey));
  const endpoints: Coord[] = [];
  for (const id of line.stops) {
    const stop = state.buildings.find(b => b.id === id && b.type === (mode === 'bus' ? 'busStop' : mode === 'brt' ? 'brtStation' : 'railStation'));
    if (!stop) return null;
    const endpoint = frontTiles(stop.type, stop.x, stop.y, stop.rotation).find(p => keys.has(tileKey(p)));
    if (!endpoint) return null;
    endpoints.push(endpoint);
  }
  const route = [endpoints[0]!], offsets = [0];
  for (let i = 1; i < endpoints.length; i++) {
    const queue = [endpoints[i - 1]!], parents = new Map<string, Coord | null>([[tileKey(queue[0]!), null]]);
    const target = endpoints[i]!;
    for (let j = 0; j < queue.length && !parents.has(tileKey(target)); j++) {
      const current = queue[j]!;
      const nextTiles = mode === 'bus' ? DIRECTIONS.map(d => neighbour(current, d)).filter(p => roads.has(tileKey(p))) : networkNeighbours(tiles, current);
      for (const next of nextTiles) {
        if (parents.has(tileKey(next))) continue;
        parents.set(tileKey(next), current); queue.push(next);
      }
    }
    if (!parents.has(tileKey(target))) return null;
    const path: Coord[] = [];
    let current: Coord | null = target;
    while (current) { path.unshift(current); current = parents.get(tileKey(current)) ?? null; }
    route.push(...path.slice(1)); offsets.push(route.length - 1);
  }
  return route.length > 1 ? { route, offsets } : null;
}

export function routeForLine(state: GameState, line: BusLine | TransitLine): Coord[] | null {
  return routeDetails(state, line)?.route ?? null;
}

export function transitServices(state: GameState, now = state.lastSeen, powerRatio = 1) {
  const hour = ((Math.floor((now + (state.timeOffset ?? 0)) / ECOLOGY.hourMs) % 24) + 24) % 24;
  const peak = (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19);
  const allLines: (BusLine | TransitLine)[] = [...(state.busLines ?? []), ...(state.transitLines ?? [])];
  return allLines.sort((a, b) => a.id - b.id).map(line => {
    const mode: TransitMode = 'mode' in line ? line.mode : 'bus';
    const details = routeDetails(state, line);
    const speed = mode === 'bus' ? 2 : TRANSIT[mode].speed;
    const cycle = details ? Math.max(2, 2 * ((details.route.length - 1) / speed + line.stops.length * .5)) : Infinity;
    const targetHeadway = 'mode' in line ? peak ? line.peakHeadway : line.offPeakHeadway : 15;
    const fleet = (state.transitFleet ?? []).filter(v => v.lineId === line.id);
    const duty = fleet.length > 0 ? Math.min(1, cycle / (targetHeadway * fleet.length)) : 0;
    const powered = state.urbs > 1e-9 && details !== null;
    const available = fleet.map(v => ({ ...v, ratio: !powered ? 0 : v.kind === 'trainCoal' ? (state.storage.materials.coal ?? 0) > 1e-9 ? 1 : 0 : powerRatio }));
    const effectiveFleet = available.reduce((n, v) => n + v.ratio, 0);
    const headway = mode === 'bus' ? targetHeadway : effectiveFleet > 0 ? Math.max(targetHeadway, cycle / (effectiveFleet * duty)) : Infinity;
    const active = powered && (mode === 'bus' || effectiveFleet > 0);
    const powerDemand = powered ? fleet.reduce((n, v) => n + TRANSIT[v.kind].power * duty, 0) : 0;
    const coalPerHour = available.reduce((n, v) => n + TRANSIT[v.kind].coal * duty * v.ratio, 0);
    const costPerHour = mode === 'bus' ? active ? ECOLOGY.busCost : 0 : available.reduce((n, v) => n + TRANSIT[v.kind].cost * duty * v.ratio, 0);
    const emissions = mode === 'bus' ? active ? .5 : 0 : available.reduce((n, v) => n + TRANSIT[v.kind].emissions * duty * v.ratio, 0);
    const capacity = active ? mode === 'bus' ? ECOLOGY.lineCapacity : TRANSIT[mode].capacity * 15 / headway : 0;
    return { ...line, mode, route: details?.route ?? null, offsets: details?.offsets ?? [], speed, targetHeadway, headway, peak, active, capacity, costPerHour, emissions, powerDemand, coalPerHour, vehicleCount: fleet.length, operatingVehicleIds: available.filter(v => v.ratio > 0).map(v => v.id) };
  });
}
