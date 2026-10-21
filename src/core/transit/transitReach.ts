import transitReach from '../../../assets/defs/balance/transitReach.json' with { type: 'json' };
import { distance, ECOLOGY } from '../environment/ecology';
import { legBetween } from './lineLeg';
import { routeDetails } from './transitService';
import { TRANSIT } from './transitNetwork';
import type { Building, GameState, TransitLine } from '../engine/state';

export const TRANSIT_REACH = transitReach;

const MAX_LINES = 3;
const MAX_TRANSFER_WALK = 2;
const STOP_DWELL_MINUTES = 0.5;

// The stops that extend reach; ordinary Bus stops never do.
export const TRANSIT_REACH_STOP_TYPES = ['brtStation', 'railStation', 'transitHub'] as const;

export interface TransitLink {
  facilityStopId: number;
  homeStopId: number;
  minutes: number;
}

interface ReachLine {
  id: number;
  loop: boolean;
  stops: number[];
  offsets: number[];
  speed: number;
  headway: number;
}

// A line serves reach once its route is connected and a vehicle is assigned; power and funds are left out so that coverage does not flicker with them.
function reachLines(state: GameState): ReachLine[] {
  const fleet = state.transitFleet ?? [];
  const lines: ReachLine[] = [];
  for (const line of state.transitLines ?? []) {
    const details = routeDetails(state, line);
    if (!details || !fleet.some(vehicle => vehicle.lineId === line.id)) continue;
    lines.push(reachLine(line, details.offsets));
  }
  return lines.sort((a, b) => a.id - b.id);
}

const reachLine = (line: TransitLine, offsets: number[]): ReachLine => ({
  id: line.id, loop: Boolean(line.loop), stops: line.stops, offsets, speed: TRANSIT[line.mode].speed, headway: line.offPeakHeadway,
});

function minutesFrom(start: Building, lines: ReachLine[], stops: ReadonlyMap<number, Building>): Map<number, number> {
  const best = new Map<number, number>([[start.id, 0]]);
  const visited = new Map<string, number>();
  const walk = (line: ReachLine, from: number, used: number[], minutes: number) => {
    const key = `${line.id}:${from}:${[...used].sort((a, b) => a - b).join(':')}`;
    if ((visited.get(key) ?? Infinity) <= minutes) return;
    visited.set(key, minutes);
    for (let end = 0; end < line.stops.length; end++) {
      if (end === from) continue;
      const stop = stops.get(line.stops[end]!);
      if (!stop) continue;
      const leg = legBetween(line, from, end);
      const arrival = minutes + line.headway / 2 + leg.distance / line.speed + leg.stops * STOP_DWELL_MINUTES;
      if (arrival < (best.get(stop.id) ?? Infinity)) best.set(stop.id, arrival);
      if (used.length >= MAX_LINES || arrival > TRANSIT_REACH.maxMinutes) continue;
      for (const next of lines) {
        if (used.includes(next.id)) continue;
        for (let i = 0; i < next.stops.length; i++) {
          const transfer = stops.get(next.stops[i]!);
          if (!transfer) continue;
          const sameStation = transfer.id === stop.id;
          if (!sameStation && distance(stop, transfer) > MAX_TRANSFER_WALK) continue;
          walk(next, i, [...used, next.id], sameStation ? arrival : arrival + 1 + distance(stop, transfer));
        }
      }
    }
  };
  for (const line of lines) {
    const index = line.stops.indexOf(start.id);
    if (index >= 0) walk(line, index, [line.id], 0);
  }
  return best;
}

// The stops of the lines that carry reach, and how many lines do.
export function servingReach(state: GameState): { lines: number; stopIds: ReadonlySet<number> } {
  const lines = reachLines(state);
  return { lines: lines.length, stopIds: new Set(lines.flatMap(line => line.stops)) };
}

export interface TransitReach {
  linksOf(facility: Building, homes: readonly Building[]): Map<number, TransitLink>;
}

// Null when no line can carry reach.
export function transitReachOf(state: GameState): TransitReach | null {
  const lines = reachLines(state);
  if (!lines.length) return null;
  const stopIds = new Set(lines.flatMap(line => line.stops));
  const stops = new Map(state.buildings.filter(building => stopIds.has(building.id)).map(building => [building.id, building]));
  const reached = new Map<number, Map<number, number>>();
  const reachedFrom = (stop: Building) => {
    let minutes = reached.get(stop.id);
    if (!minutes) { minutes = minutesFrom(stop, lines, stops); reached.set(stop.id, minutes); }
    return minutes;
  };
  const near = (building: Building) => [...stops.values()].filter(stop => distance(building, stop) <= ECOLOGY.stopRadius);
  return {
    linksOf(facility, homes) {
      const origins = near(facility);
      const links = new Map<number, TransitLink>();
      if (!origins.length) return links;
      for (const home of homes) {
        for (const origin of origins) {
          const minutes = reachedFrom(origin);
          for (const destination of near(home)) {
            const time = minutes.get(destination.id);
            if (time === undefined || time > TRANSIT_REACH.maxMinutes) continue;
            if (time < (links.get(home.id)?.minutes ?? Infinity)) links.set(home.id, { facilityStopId: origin.id, homeStopId: destination.id, minutes: time });
          }
        }
      }
      return links;
    },
  };
}
