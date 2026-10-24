import { isHomeType } from '../buildings/buildingDefinitions';
import { citizensOf } from '../buildings/city';
import { diagnosisOf, type Cause, type Diagnosis } from '../diagnosis/diagnosis';
import type { Building, GameState } from '../engine/state';
import type { Coord } from '../map/coord';
import { tileKey } from '../map/geometry';
import { type CongestionStats, type SectionLoad } from './congestion';
import { jobsOf, workplaceTypes } from './jobs';

export const CONGESTION_DIAGNOSIS = {
  minSaturatedSections: 3,
  untouchedTierShare: 0.6,
  corridorMinLength: 4,
  corridorLoadSpread: 0.1,
  crossingMinCut: 0.2,
  farDistance: 8,
  farSpanShare: 0.25,
  carShare: 0.5,
  minShiftShare: 0.02,
};

interface Facts {
  state: GameState;
  congestion: CongestionStats;
  tiers: ReadonlyMap<string, number>;
  citizens: number;
  congestedShare: number;
  saturated: readonly SectionLoad[];
  hasTransitLines: boolean;
}

const byKey = (a: SectionLoad, b: SectionLoad) => tileKey(a.tile).localeCompare(tileKey(b.tile));
const byWorst = (a: SectionLoad, b: SectionLoad) => b.ratio - a.ratio || byKey(a, b);
const manhattan = (a: Coord, b: Coord) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function factsOf(state: GameState, congestion: CongestionStats, hasTransitLines: boolean): Facts {
  const homes = state.buildings.filter(building => isHomeType(building.type));
  const citizens = homes.reduce((sum, home) => sum + citizensOf(home.tier), 0);
  const congested = homes.filter(home => {
    const entry = congestion.homes.get(home.id);
    return entry !== undefined && !entry.disconnected && entry.ratio > 1;
  });
  const congestedCitizens = congested.reduce((sum, home) => sum + citizensOf(home.tier), 0);
  return {
    state,
    congestion,
    tiers: new Map(state.roads.map(road => [tileKey(road), road.tier ?? 1])),
    citizens,
    congestedShare: citizens > 0 ? congestedCitizens / citizens : 0,
    saturated: [...congestion.sections.values()].filter(section => section.ratio > 1).sort(byKey),
    hasTransitLines,
  };
}

function untouchedTiers(facts: Facts): Cause | null {
  const { saturated, tiers } = facts;
  if (saturated.length < CONGESTION_DIAGNOSIS.minSaturatedSections) return null;
  const tierOne = saturated.filter(section => (tiers.get(tileKey(section.tile)) ?? 1) === 1).sort(byWorst);
  const share = tierOne.length / saturated.length;
  if (share < CONGESTION_DIAGNOSIS.untouchedTierShare) return null;
  return { key: 'diagnosis.congestion.untouchedTiers', weight: facts.congestedShare * share, params: { tier1: tierOne.length, saturated: saturated.length }, focus: [tierOne[0]!.tile] };
}

function saturatedRuns(saturated: readonly SectionLoad[]): SectionLoad[][] {
  const byTile = new Map(saturated.map(section => [tileKey(section.tile), section]));
  const seen = new Set<string>();
  const runs: SectionLoad[][] = [];
  for (const start of saturated) {
    if (seen.has(tileKey(start.tile))) continue;
    const run = [start];
    seen.add(tileKey(start.tile));
    for (let index = 0; index < run.length; index++) {
      const { tile, load } = run[index]!;
      for (const next of [{ x: tile.x + 1, y: tile.y }, { x: tile.x - 1, y: tile.y }, { x: tile.x, y: tile.y + 1 }, { x: tile.x, y: tile.y - 1 }]) {
        const neighbour = byTile.get(tileKey(next));
        if (!neighbour || seen.has(tileKey(next))) continue;
        if (Math.abs(neighbour.load - load) > CONGESTION_DIAGNOSIS.corridorLoadSpread * Math.max(neighbour.load, load)) continue;
        seen.add(tileKey(next));
        run.push(neighbour);
      }
    }
    runs.push(run);
  }
  return runs;
}

function farthestPair(run: readonly SectionLoad[]): [Coord, Coord] {
  let best: [Coord, Coord] = [run[0]!.tile, run[0]!.tile];
  let distance = -1;
  for (const a of run) {
    for (const b of run) {
      const apart = manhattan(a.tile, b.tile);
      if (apart <= distance) continue;
      distance = apart;
      best = [a.tile, b.tile];
    }
  }
  return best;
}

function medianOf(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

function corridor(facts: Facts): Cause | null {
  const runs = saturatedRuns(facts.saturated).filter(run => run.length >= CONGESTION_DIAGNOSIS.corridorMinLength);
  if (runs.length === 0 || facts.citizens === 0) return null;
  const loadOf = (run: readonly SectionLoad[]) => Math.max(...run.map(section => section.load));
  const heaviest = runs.sort((a, b) => loadOf(b) - loadOf(a) || b.length - a.length || byKey(a[0]!, b[0]!))[0]!;
  const [from, to] = farthestPair([...heaviest].sort(byKey));
  const load = loadOf(heaviest);
  return {
    key: 'diagnosis.congestion.corridor',
    weight: Math.min(1, load / facts.citizens),
    params: { length: heaviest.length, load: Math.round(load), capacity: Math.round(medianOf(heaviest.map(section => section.capacity))), fromX: from.x, fromY: from.y, toX: to.x, toY: to.y },
    focus: [[...heaviest].sort(byWorst)[0]!.tile],
  };
}

function crossingsChoke(facts: Facts): Cause | null {
  const choked = facts.saturated
    .flatMap(section => {
      const crossing = facts.congestion.crossings.get(tileKey(section.tile));
      return crossing && crossing.cut >= CONGESTION_DIAGNOSIS.crossingMinCut ? [{ section, crossing }] : [];
    })
    .sort((a, b) => b.crossing.pedestrians - a.crossing.pedestrians || byKey(a.section, b.section));
  if (choked.length === 0 || facts.citizens === 0) return null;
  const load = Math.max(...choked.map(({ section }) => section.load));
  return {
    key: 'diagnosis.congestion.crossingsChoke',
    weight: Math.min(1, load / facts.citizens),
    params: { count: choked.length, cut: Math.round(Math.max(...choked.map(({ crossing }) => crossing.cut)) * 100) },
    focus: [choked[0]!.section.tile],
  };
}

function barycentre(buildings: readonly Building[], weightOf: (building: Building) => number): Coord | null {
  const total = buildings.reduce((sum, building) => sum + weightOf(building), 0);
  if (total === 0) return null;
  return {
    x: buildings.reduce((sum, building) => sum + building.x * weightOf(building), 0) / total,
    y: buildings.reduce((sum, building) => sum + building.y * weightOf(building), 0) / total,
  };
}

function homesFarFromJobs(facts: Facts): Cause | null {
  if (facts.saturated.length === 0) return null;
  const buildings = [...facts.state.buildings].sort((a, b) => a.id - b.id);
  const homes = buildings.filter(building => isHomeType(building.type));
  const workplaces = buildings.filter(building => workplaceTypes.includes(building.type));
  const homeCentre = barycentre(homes, home => citizensOf(home.tier));
  const jobCentre = barycentre(workplaces, jobsOf);
  if (!homeCentre || !jobCentre) return null;
  const xs = [...homes, ...workplaces].map(building => building.x);
  const ys = [...homes, ...workplaces].map(building => building.y);
  const span = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const distance = Math.hypot(homeCentre.x - jobCentre.x, homeCentre.y - jobCentre.y);
  if (distance < CONGESTION_DIAGNOSIS.farDistance || distance < CONGESTION_DIAGNOSIS.farSpanShare * span) return null;
  const round = (coord: Coord): Coord => ({ x: Math.round(coord.x), y: Math.round(coord.y) });
  const [home, job] = [round(homeCentre), round(jobCentre)];
  return {
    key: 'diagnosis.congestion.homesFarFromJobs',
    weight: facts.congestedShare,
    params: { homeX: home.x, homeY: home.y, jobX: job.x, jobY: job.y, distance: Math.round(distance) },
    focus: [home, job],
  };
}

function carHeavy(facts: Facts): Cause | null {
  const { modes, shift } = facts.congestion;
  const trips = modes.car + modes.transit + modes.walking + modes.cycling;
  if (facts.saturated.length === 0 || trips === 0) return null;
  const share = modes.car / trips;
  if (share < CONGESTION_DIAGNOSIS.carShare || shift.total > CONGESTION_DIAGNOSIS.minShiftShare * modes.car) return null;
  return {
    key: facts.hasTransitLines ? 'diagnosis.congestion.carHeavy' : 'diagnosis.congestion.noTransit',
    weight: facts.congestedShare,
    params: { car: Math.round(share * 100), shifted: Math.round(shift.total) },
    focus: [],
  };
}

function disconnected(facts: Facts): Cause | null {
  const homes = facts.state.buildings.filter(building => facts.congestion.homes.get(building.id)?.disconnected);
  if (homes.length === 0 || facts.citizens === 0) return null;
  const cutOff = homes.reduce((sum, home) => sum + citizensOf(home.tier), 0);
  const section = facts.congestion.disconnectedSections[0]?.[0];
  return { key: 'diagnosis.congestion.disconnected', weight: cutOff / facts.citizens, params: { homes: homes.length }, focus: section ? [section] : [] };
}

export function diagnoseCongestion(state: GameState, congestion: CongestionStats, transport: { lines: readonly unknown[] }): Diagnosis {
  const facts = factsOf(state, congestion, transport.lines.length > 0);
  const causes = [untouchedTiers, corridor, crossingsChoke, homesFarFromJobs, carHeavy, disconnected].flatMap(rule => rule(facts) ?? []);
  return diagnosisOf(causes);
}
