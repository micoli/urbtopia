import { isIndustryType } from '../economy/productionTypes';
import { isShopType } from '../economy/shops';
import { ECOLOGY, distance } from '../environment/ecology';
import { HOME_TIERS } from '../economy/economy';
import { energyStats } from '../environment/energy';
import { workplaceTypes } from '../traffic/jobs';
import { hasBrtOnlyAccess } from '../map/placement';
import { transitServices, type SpeedFactors } from './transitService';
import type { Building, GameState } from '../engine/state';
import { isHomeType } from '../buildings/buildingDefinitions';
import { isTransitStopType } from './stopNames';
import { WALKING } from '../traffic/walking';
import { legBetween } from './lineLeg';
export { routeForLine, routeFailure } from './transitService';

type Service = ReturnType<typeof transitServices>[number];
interface RideLeg { board: number; alight: number; }
export interface TransitOption { lines: number[]; minutes: number; bike: boolean; legs: RideLeg[]; targets: number[]; }
type Itinerary = TransitOption;

export interface TransitTrip { from: number; to: number; count: number; stops: number[]; }

export interface StopFlow { boarded: number; alighted: number; }

const carriesBikes = (line: Service) => line.mode !== 'bus';
const bikeRadius = () => ECOLOGY.stopRadius * WALKING.cyclingFactor;

// A cyclist takes the bicycle aboard, so every line of its itinerary must carry bikes; the walking itineraries are those of bikeMode off.
function itineraries(first: Service, firstStop: number, lines: Service[], stops: Map<number, Building>, activities: Building[], bikeMode = false, homeBike = false): Itinerary[] {
  const radius = bikeMode ? bikeRadius() : ECOLOGY.stopRadius;
  const results: Itinerary[] = [];
  const visited = new Map<string, number>();
  const walk = (line: Service, start: number, used: number[], minutes: number, done: RideLeg[]) => {
    const key = `${line.id}:${start}:${[...used].sort((a, b) => a - b).join(':')}`;
    if ((visited.get(key) ?? Infinity) <= minutes) return;
    visited.set(key, minutes);
    for (let end = 0; end < line.stops.length; end++) {
      if (end === start) continue;
      const stop = stops.get(line.stops[end]!);
      if (!stop) continue;
      const leg = legBetween(line, start, end);
      const ridden = [...done, { board: line.stops[start]!, alight: stop.id }];
      const arrival = minutes + line.headway / 2 + leg.distance / line.speed + leg.stops * .5;
      if (activities.some(a => distance(a, stop) <= radius)) {
        const bike = bikeMode && (homeBike || !activities.some(a => distance(a, stop) <= ECOLOGY.stopRadius));
        if (!bikeMode || bike) results.push({ lines: used, minutes: arrival, bike, legs: ridden, targets: activities.filter(a => distance(a, stop) <= radius).map(a => a.id) });
      }
      if (used.length >= 3) continue;
      for (const next of lines) {
        if (used.includes(next.id) || !next.active || (bikeMode && !carriesBikes(next))) continue;
        for (let i = 0; i < next.stops.length; i++) {
          const transfer = stops.get(next.stops[i]!);
          if (!transfer) continue;
          const sameStation = transfer.id === stop.id;
          if (!sameStation && distance(stop, transfer) > 2) continue;
          walk(next, i, [...used, next.id], sameStation ? arrival : arrival + 1 + distance(stop, transfer), ridden);
        }
      }
    }
  };
  walk(first, firstStop, [first.id], 0, []);
  const best = new Map<string, Itinerary>();
  for (const result of results) {
    const key = `${result.lines.join(':')}${result.bike ? ':bike' : ''}`;
    if ((best.get(key)?.minutes ?? Infinity) > result.minutes) best.set(key, result);
  }
  return [...best.values()].sort((a, b) => a.minutes - b.minutes || a.lines.join(':').localeCompare(b.lines.join(':')) || Number(a.bike) - Number(b.bike));
}

function flowAt(flows: Map<number, StopFlow>, stop: number): StopFlow {
  let flow = flows.get(stop);
  if (!flow) { flow = { boarded: 0, alighted: 0 }; flows.set(stop, flow); }
  return flow;
}

export type TransitNetwork = ReturnType<typeof calculateNetwork>;
export type TransportStats = ReturnType<typeof transportStatsOf>;

// A Rider the Commute sent along one itinerary to one workplace.
export interface RiderAllocation { home: number; workplace: number; option: TransitOption; count: number; }

const networkCache = new WeakMap<GameState, { now: number; network: TransitNetwork }>();
const slowedCache = new WeakMap<SpeedFactors, { state: GameState; now: number; network: TransitNetwork }>();

// The lines and the itineraries from each Home to every workplace they serve; who rides is decided by the Commute.
export function transitNetwork(state: GameState, now = state.lastSeen, speedFactors?: SpeedFactors): TransitNetwork {
  if (speedFactors) {
    const slowed = slowedCache.get(speedFactors);
    if (slowed?.state === state && slowed.now === now) return slowed.network;
    const network = calculateNetwork(state, now, speedFactors); slowedCache.set(speedFactors, { state, now, network });
    return network;
  }
  const cached = networkCache.get(state);
  if (cached?.now === now) return cached.network;
  const network = calculateNetwork(state, now); networkCache.set(state, { now, network });
  return network;
}

function buildStructure(services: Service[], homes: Building[], workplaces: Building[], activities: Building[], stops: Map<number, Building>): NetworkStructure {
  const optionsByStop = new Map<string, Itinerary[]>();
  const homeOptions = new Map<number, TransitOption[]>();
  const homeCitizens = new Map<number, number>();
  const coveredActivities = new Set<number>();
  const coveredWorkplaces = new Set<number>();
  for (const line of services) {
    if (!line.active) continue;
    for (const stop of line.stops.flatMap(id => stops.get(id) ?? [])) {
      for (const activity of activities) if (distance(activity, stop) <= ECOLOGY.stopRadius) coveredActivities.add(activity.id);
      for (const workplace of workplaces) if (distance(workplace, stop) <= ECOLOGY.stopRadius) coveredWorkplaces.add(workplace.id);
    }
  }
  let covered = 0;
  for (const home of homes) {
    const options: Itinerary[] = [];
    for (const line of services) {
      if (!line.active) continue;
      for (let i = 0; i < line.stops.length; i++) {
        const stop = stops.get(line.stops[i]!);
        if (!stop) continue;
        const gap = distance(home, stop);
        if (gap <= ECOLOGY.stopRadius) {
          const key = `${line.id}:${i}`;
          let paths = optionsByStop.get(key);
          if (!paths) { paths = itineraries(line, i, services, stops, workplaces); optionsByStop.set(key, paths); }
          options.push(...paths.map(path => ({ ...path, minutes: path.minutes + gap })));
        }
        if (!carriesBikes(line) || gap > bikeRadius()) continue;
        const homeBike = gap > ECOLOGY.stopRadius;
        const bikeKey = `${line.id}:${i}:${homeBike ? 'far' : 'near'}`;
        let rides = optionsByStop.get(bikeKey);
        if (!rides) { rides = itineraries(line, i, services, stops, workplaces, true, homeBike); optionsByStop.set(bikeKey, rides); }
        options.push(...rides.map(path => ({ ...path, minutes: path.minutes + gap / WALKING.cyclingFactor })));
      }
    }
    options.sort((a, b) => a.minutes - b.minutes || a.lines.join(':').localeCompare(b.lines.join(':')));
    const citizens = HOME_TIERS[home.tier - 1]?.citizens ?? 0;
    homeCitizens.set(home.id, citizens);
    if (options.length) { covered += citizens; homeOptions.set(home.id, options); }
  }
  return { homeOptions, homeCitizens, covered, coveredActivities, coveredWorkplaces };
}

interface NetworkStructure {
  homeOptions: Map<number, TransitOption[]>;
  homeCitizens: Map<number, number>;
  covered: number;
  coveredActivities: Set<number>;
  coveredWorkplaces: Set<number>;
}

const STRUCTURES_KEPT = 6;
const structures = new Map<string, NetworkStructure>();

const placeOf = (b: Building) => `${b.id}:${b.type}:${b.x}:${b.y}:${b.rotation}:${b.tier}`;

// Who is served by which itinerary depends only on the lines and on where the stops, Homes, workplaces and activities stand: a replay step that changes none of them reuses it.
function networkStructureOf(services: Service[], homes: Building[], workplaces: Building[], activities: Building[], stops: Map<number, Building>): NetworkStructure {
  const lines = services.map(l => `${l.id}:${l.active ? 1 : 0}:${l.mode}:${l.loop ? 1 : 0}:${l.headway}:${l.speed}:${l.stops.join(',')}:${l.offsets.join(',')}`);
  const key = [lines.join('|'), [...stops.values()].map(placeOf).join('|'), homes.map(placeOf).join('|'), workplaces.map(placeOf).join('|'), activities.map(placeOf).join('|')].join('#');
  const known = structures.get(key);
  if (known) {
    structures.delete(key);
    structures.set(key, known);
    return known;
  }
  const created = buildStructure(services, homes, workplaces, activities, stops);
  structures.set(key, created);
  if (structures.size > STRUCTURES_KEPT) structures.delete(structures.keys().next().value!);
  return created;
}

function calculateNetwork(state: GameState, now: number, speedFactors?: SpeedFactors) {
  const energy = energyStats(state, now);
  const services = transitServices(state, now, energy.transitRatio, speedFactors);
  const homes = state.buildings.filter(b => isHomeType(b.type)).sort((a, b) => a.id - b.id);
  const workplaces = state.buildings.filter(b => workplaceTypes.includes(b.type));
  const activities = state.buildings.filter(b => isIndustryType(b.type) || isShopType(b.type) || (workplaceTypes.includes(b.type) && hasBrtOnlyAccess(state, b)));
  const stops = new Map(state.buildings.filter(b => isTransitStopType(b.type)).map(b => [b.id, b]));
  const { homeOptions, homeCitizens, covered, coveredActivities, coveredWorkplaces } = networkStructureOf(services, homes, workplaces, activities, stops);
  return { services, homeOptions, homeCitizens, covered, coveredActivities, coveredWorkplaces,
    activeLines: services.filter(l => l.active).length,
    costPerHour: services.reduce((n, l) => n + l.costPerHour, 0), coalPerHour: services.reduce((n, l) => n + l.coalPerHour, 0),
    emissions: services.reduce((n, l) => n + l.emissions, 0) };
}

// The lines with the Riders the Commute allocated, and where they board and alight.
export function transportStatsOf(network: TransitNetwork, allocations: readonly RiderAllocation[]) {
  const lines = network.services.map(l => ({ ...l, riders: 0, cyclists: 0, homeIds: [] as number[], covered: 0 }));
  const byId = new Map(lines.map(l => [l.id, l]));
  const homeRiders = new Map<number, number>();
  const stopFlows = new Map<number, StopFlow>();
  const trips: TransitTrip[] = [];
  let riders = 0, transferRiders = 0;
  for (const { home, workplace, option, count } of allocations) {
    for (const id of option.lines) {
      const line = byId.get(id)!;
      line.riders += count;
      if (option.bike) line.cyclists += count;
      if (!line.homeIds.includes(home)) { line.homeIds.push(home); line.covered += network.homeCitizens.get(home) ?? 0; }
    }
    riders += count;
    homeRiders.set(home, (homeRiders.get(home) ?? 0) + count);
    trips.push({ from: home, to: workplace, count, stops: option.legs.flatMap(leg => [leg.board, leg.alight]) });
    for (const leg of option.legs) {
      flowAt(stopFlows, leg.board).boarded += count;
      flowAt(stopFlows, leg.alight).alighted += count;
    }
    if (option.lines.length > 1) transferRiders += count;
  }
  const homeLines = new Map([...network.homeOptions].map(([home, options]) => [home, options.map(option => option.lines)]));
  return { lines, covered: network.covered, riders, homeRiders, homeLines, stopFlows, trips, coveredActivities: network.coveredActivities, transferRiders, activeLines: network.activeLines,
    costPerHour: network.costPerHour, coalPerHour: network.coalPerHour, emissions: network.emissions };
}
