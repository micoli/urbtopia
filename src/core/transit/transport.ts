import { ECOLOGY, citizenCount, distance } from '../environment/ecology';
import { HOME_TIERS } from '../economy/economy';
import { energyStats } from '../environment/energy';
import { transitServices, type SpeedFactors } from './transitService';
import type { Building, GameState } from '../engine/state';
export { routeForLine, routeFailure } from './transitService';

type Service = ReturnType<typeof transitServices>[number];
interface Itinerary { lines: number[]; minutes: number; }

export const TRANSIT_ELIGIBLE_SHARE = 0.7;

function itineraries(first: Service, firstStop: number, lines: Service[], stops: Map<number, Building>, activities: Building[]): Itinerary[] {
  const results: Itinerary[] = [];
  const visited = new Map<string, number>();
  const walk = (line: Service, start: number, used: number[], minutes: number) => {
    const key = `${line.id}:${start}:${[...used].sort((a, b) => a - b).join(':')}`;
    if ((visited.get(key) ?? Infinity) <= minutes) return;
    visited.set(key, minutes);
    for (let end = 0; end < line.stops.length; end++) {
      if (end === start) continue;
      const stop = stops.get(line.stops[end]!);
      if (!stop) continue;
      const arrival = minutes + line.headway / 2 + Math.abs(line.offsets[end]! - line.offsets[start]!) / line.speed + Math.abs(end - start) * .5;
      if (activities.some(a => distance(a, stop) <= ECOLOGY.stopRadius)) results.push({ lines: used, minutes: arrival });
      if (used.length >= 3) continue;
      for (const next of lines) {
        if (used.includes(next.id) || !next.active) continue;
        for (let i = 0; i < next.stops.length; i++) {
          const transfer = stops.get(next.stops[i]!);
          if (!transfer || distance(stop, transfer) > 2) continue;
          walk(next, i, [...used, next.id], arrival + 1 + distance(stop, transfer));
        }
      }
    }
  };
  walk(first, firstStop, [first.id], 0);
  const best = new Map<string, Itinerary>();
  for (const result of results) {
    const key = result.lines.join(':');
    if ((best.get(key)?.minutes ?? Infinity) > result.minutes) best.set(key, result);
  }
  return [...best.values()].sort((a, b) => a.minutes - b.minutes || a.lines.join(':').localeCompare(b.lines.join(':')));
}

type TransportStats = ReturnType<typeof calculateTransport>;

const statsCache = new WeakMap<GameState, { now: number; stats: TransportStats }>();
const slowedCache = new WeakMap<SpeedFactors, { state: GameState; now: number; stats: TransportStats }>();

export function transportStats(state: GameState, now = state.lastSeen, speedFactors?: SpeedFactors): TransportStats {
  if (speedFactors) {
    const slowed = slowedCache.get(speedFactors);
    if (slowed?.state === state && slowed.now === now) return slowed.stats;
    const stats = calculateTransport(state, now, speedFactors); slowedCache.set(speedFactors, { state, now, stats });
    return stats;
  }
  const cached = statsCache.get(state);
  if (cached?.now === now) return cached.stats;
  const stats = calculateTransport(state, now); statsCache.set(state, { now, stats });
  return stats;
}

function calculateTransport(state: GameState, now: number, speedFactors?: SpeedFactors) {
  const energy = energyStats(state, now);
  const services = transitServices(state, now, energy.transitRatio, speedFactors);
  const lines = services.map(line => ({ ...line, riders: 0, homeIds: [] as number[], covered: 0 }));
  const byId = new Map(lines.map(l => [l.id, l]));
  const homes = state.buildings.filter(b => b.type === 'home').sort((a, b) => a.id - b.id);
  const activities = state.buildings.filter(b => ['workshop', 'factory', 'shop'].includes(b.type));
  const stops = new Map(state.buildings.filter(b => ['busStop', 'brtStation', 'railStation'].includes(b.type)).map(b => [b.id, b]));
  const optionsByStop = new Map<string, Itinerary[]>();
  const homeRiders = new Map<number, number>();
  const homeLines = new Map<number, number[][]>();
  let riders = 0, covered = 0, transferRiders = 0;
  for (const home of homes) {
    const options: Itinerary[] = [];
    for (const line of lines) {
      if (!line.active) continue;
      for (let i = 0; i < line.stops.length; i++) {
        const stop = stops.get(line.stops[i]!);
        if (!stop || distance(home, stop) > ECOLOGY.stopRadius) continue;
        const key = `${line.id}:${i}`;
        let paths = optionsByStop.get(key);
        if (!paths) { paths = itineraries(line, i, lines, stops, activities); optionsByStop.set(key, paths); }
        options.push(...paths.map(path => ({ ...path, minutes: path.minutes + distance(home, stop) })));
      }
    }
    options.sort((a, b) => a.minutes - b.minutes || a.lines.join(':').localeCompare(b.lines.join(':')));
    const citizens = HOME_TIERS[home.tier - 1]?.citizens ?? 0;
    if (options.length) covered += citizens;
    let remaining = citizens * TRANSIT_ELIGIBLE_SHARE;
    if (options.length) homeLines.set(home.id, options.map(option => option.lines));
    for (const option of options) {
      const used = option.lines.map(id => byId.get(id)!);
      const allocated = Math.max(0, Math.min(remaining, ...used.map(l => l.capacity - l.riders)));
      if (allocated <= 0) continue;
      for (const line of used) { line.riders += allocated; if (!line.homeIds.includes(home.id)) { line.homeIds.push(home.id); line.covered += citizens; } }
      riders += allocated; remaining -= allocated;
      homeRiders.set(home.id, (homeRiders.get(home.id) ?? 0) + allocated);
      if (used.length > 1) transferRiders += allocated;
      if (remaining <= 1e-9) break;
    }
  }
  return { lines, covered, riders, homeRiders, homeLines, transferRiders, activeLines: lines.filter(l => l.active).length,
    costPerHour: lines.reduce((n, l) => n + l.costPerHour, 0), coalPerHour: lines.reduce((n, l) => n + l.coalPerHour, 0),
    emissions: Math.max(0, citizenCount(state) - riders) / 10 + lines.reduce((n, l) => n + l.emissions, 0) };
}
