import { isIndustryType } from '../economy/productionTypes';
import { isShopType } from '../economy/shops';
import { ECOLOGY, citizenCount, distance } from '../environment/ecology';
import { HOME_TIERS } from '../economy/economy';
import { energyStats } from '../environment/energy';
import { workplaceTypes } from '../traffic/jobs';
import { hasBrtOnlyAccess } from '../map/placement';
import { transitServices, type SpeedFactors } from './transitService';
import type { Building, GameState } from '../engine/state';
import { isHomeType } from '../buildings/buildingDefinitions';
import { isTransitStopType } from './stopNames';
import { WALKING } from '../traffic/walking';
export { routeForLine, routeFailure } from './transitService';

type Service = ReturnType<typeof transitServices>[number];
interface Itinerary { lines: number[]; minutes: number; bike: boolean; }

const carriesBikes = (line: Service) => line.mode !== 'bus';
const bikeRadius = () => ECOLOGY.stopRadius * WALKING.cyclingFactor;

export const TRANSIT_ELIGIBLE_SHARE = 0.7;

function legBetween(line: Service, start: number, end: number): { distance: number; stops: number } {
  if (!line.loop) return { distance: Math.abs(line.offsets[end]! - line.offsets[start]!), stops: Math.abs(end - start) };
  if (end > start) return { distance: line.offsets[end]! - line.offsets[start]!, stops: end - start };
  return { distance: line.offsets[line.stops.length]! - line.offsets[start]! + line.offsets[end]!, stops: line.stops.length - start + end };
}

// A cyclist takes the bicycle aboard, so every line of its itinerary must carry bikes; the walking itineraries are those of bikeMode off.
function itineraries(first: Service, firstStop: number, lines: Service[], stops: Map<number, Building>, activities: Building[], bikeMode = false, homeBike = false): Itinerary[] {
  const radius = bikeMode ? bikeRadius() : ECOLOGY.stopRadius;
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
      const leg = legBetween(line, start, end);
      const arrival = minutes + line.headway / 2 + leg.distance / line.speed + leg.stops * .5;
      if (activities.some(a => distance(a, stop) <= radius)) {
        const bike = bikeMode && (homeBike || !activities.some(a => distance(a, stop) <= ECOLOGY.stopRadius));
        if (!bikeMode || bike) results.push({ lines: used, minutes: arrival, bike });
      }
      if (used.length >= 3) continue;
      for (const next of lines) {
        if (used.includes(next.id) || !next.active || (bikeMode && !carriesBikes(next))) continue;
        for (let i = 0; i < next.stops.length; i++) {
          const transfer = stops.get(next.stops[i]!);
          if (!transfer) continue;
          const sameStation = transfer.id === stop.id;
          if (!sameStation && distance(stop, transfer) > 2) continue;
          walk(next, i, [...used, next.id], sameStation ? arrival : arrival + 1 + distance(stop, transfer));
        }
      }
    }
  };
  walk(first, firstStop, [first.id], 0);
  const best = new Map<string, Itinerary>();
  for (const result of results) {
    const key = `${result.lines.join(':')}${result.bike ? ':bike' : ''}`;
    if ((best.get(key)?.minutes ?? Infinity) > result.minutes) best.set(key, result);
  }
  return [...best.values()].sort((a, b) => a.minutes - b.minutes || a.lines.join(':').localeCompare(b.lines.join(':')) || Number(a.bike) - Number(b.bike));
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
  const lines = services.map(line => ({ ...line, riders: 0, cyclists: 0, homeIds: [] as number[], covered: 0 }));
  const byId = new Map(lines.map(l => [l.id, l]));
  const homes = state.buildings.filter(b => isHomeType(b.type)).sort((a, b) => a.id - b.id);
  const activities = state.buildings.filter(b => isIndustryType(b.type) || isShopType(b.type) || (workplaceTypes.includes(b.type) && hasBrtOnlyAccess(state, b)));
  const stops = new Map(state.buildings.filter(b => isTransitStopType(b.type)).map(b => [b.id, b]));
  const optionsByStop = new Map<string, Itinerary[]>();
  const homeRiders = new Map<number, number>();
  const homeLines = new Map<number, number[][]>();
  const coveredActivities = new Set<number>();
  for (const line of lines) {
    if (!line.active) continue;
    for (const stop of line.stops.flatMap(id => stops.get(id) ?? [])) for (const activity of activities) if (distance(activity, stop) <= ECOLOGY.stopRadius) coveredActivities.add(activity.id);
  }
  let riders = 0, covered = 0, transferRiders = 0;
  for (const home of homes) {
    const options: Itinerary[] = [];
    for (const line of lines) {
      if (!line.active) continue;
      for (let i = 0; i < line.stops.length; i++) {
        const stop = stops.get(line.stops[i]!);
        if (!stop) continue;
        const gap = distance(home, stop);
        if (gap <= ECOLOGY.stopRadius) {
          const key = `${line.id}:${i}`;
          let paths = optionsByStop.get(key);
          if (!paths) { paths = itineraries(line, i, lines, stops, activities); optionsByStop.set(key, paths); }
          options.push(...paths.map(path => ({ ...path, minutes: path.minutes + gap })));
        }
        if (!carriesBikes(line) || gap > bikeRadius()) continue;
        const homeBike = gap > ECOLOGY.stopRadius;
        const bikeKey = `${line.id}:${i}:${homeBike ? 'far' : 'near'}`;
        let rides = optionsByStop.get(bikeKey);
        if (!rides) { rides = itineraries(line, i, lines, stops, activities, true, homeBike); optionsByStop.set(bikeKey, rides); }
        options.push(...rides.map(path => ({ ...path, minutes: path.minutes + gap / WALKING.cyclingFactor })));
      }
    }
    options.sort((a, b) => a.minutes - b.minutes || a.lines.join(':').localeCompare(b.lines.join(':')));
    const citizens = HOME_TIERS[home.tier - 1]?.citizens ?? 0;
    if (options.length) covered += citizens;
    let remaining = citizens * TRANSIT_ELIGIBLE_SHARE;
    if (options.length) homeLines.set(home.id, options.map(option => option.lines));
    for (const option of options) {
      const used = option.lines.map(id => byId.get(id)!);
      const places = option.bike ? 2 : 1;
      const allocated = Math.max(0, Math.min(remaining, ...used.map(l => (l.capacity - l.riders - l.cyclists) / places)));
      if (allocated <= 0) continue;
      for (const line of used) { line.riders += allocated; if (option.bike) line.cyclists += allocated; if (!line.homeIds.includes(home.id)) { line.homeIds.push(home.id); line.covered += citizens; } }
      riders += allocated; remaining -= allocated;
      homeRiders.set(home.id, (homeRiders.get(home.id) ?? 0) + allocated);
      if (used.length > 1) transferRiders += allocated;
      if (remaining <= 1e-9) break;
    }
  }
  return { lines, covered, riders, homeRiders, homeLines, coveredActivities, transferRiders, activeLines: lines.filter(l => l.active).length,
    costPerHour: lines.reduce((n, l) => n + l.costPerHour, 0), coalPerHour: lines.reduce((n, l) => n + l.coalPerHour, 0),
    emissions: Math.max(0, citizenCount(state) - riders) / 10 + lines.reduce((n, l) => n + l.emissions, 0) };
}
