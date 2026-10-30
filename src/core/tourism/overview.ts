import { BUILDING_ENTRIES } from '../buildings/buildingDefinitions';
import type { BuildingId } from '../buildings/buildingTypes.generated';
import { totalCitizens } from '../buildings/city';
import type { Building, GameState, GatheringData } from '../engine/state';
import { congestionStats } from '../traffic/congestion';
import { HOTEL, attractivePlaces, cityAttractiveness } from '../venues/hotel';
import { gatheringPhase, type GatheringPhase } from './gatheringWindow';
import { inGatheringCooldown, isShowType, previewGathering } from './gatherings';
import { artistOffer } from './artists';
import { attractionTakingsCapOf, earningsPerHour, takingsOf, touristsPerDay } from './takings';
import type { TouristMode } from './touristFlows';
import { boostOf, isAttraction, spendingFactor } from './tourists';

export type TouristModes = Record<TouristMode, number>;

export interface AttractionRow {
  building: Building;
  tourists: number;
  perHour: number;
  takings: number;
  cap: number;
  full: boolean;
  // Hours until the Takings are full, null when nothing more comes in.
  hoursToFull: number | null;
  modes: TouristModes;
  gathering: GatheringData | null;
  phase: GatheringPhase | null;
  canHoldShow: boolean;
}

export type TourismAdvice =
  | { kind: 'collect'; buildingId: number; count: number }
  | { kind: 'show'; buildingId: number; net: number }
  | { kind: 'hotel' }
  | { kind: 'attractiveness'; missing: number }
  | { kind: 'station'; buildingId: number; count: number };

export interface TourismOverview {
  attractions: AttractionRow[];
  touristsPerDay: number;
  perHour: number;
  toCollect: number;
  attractiveness: number;
  places: number;
  placesGoal: number;
  hotels: number;
  spending: number;
  gatherings: AttractionRow[];
  advice: TourismAdvice[];
}

export function touristModesOf(state: GameState, buildingId: number): TouristModes {
  const modes: TouristModes = { car: 0, walk: 0, transit: 0 };
  for (const flow of congestionStats(state).touristFlows) if (flow.to === buildingId) modes[flow.mode] += flow.count;
  return modes;
}

interface CityDraw {
  attractiveness: number;
  spending: number;
}

const cityDrawOf = (state: GameState): CityDraw => ({ attractiveness: cityAttractiveness(state), spending: spendingFactor(state) });

function rowOf(state: GameState, building: Building, modes: TouristModes, { attractiveness, spending }: CityDraw): AttractionRow {
  const now = state.lastSeen;
  const boost = boostOf(building, now);
  const perHour = earningsPerHour(building, attractiveness, spending) * boost;
  const takings = takingsOf(building);
  const cap = attractionTakingsCapOf(building);
  const full = takings >= cap;
  const gathering = building.attraction?.gathering ?? null;
  return {
    building,
    tourists: touristsPerDay(building, attractiveness) * boost,
    perHour,
    takings,
    cap,
    full,
    hoursToFull: full || perHour <= 0 ? null : (cap - takings) / perHour,
    modes,
    gathering,
    phase: gathering && gatheringPhase(gathering, now),
    canHoldShow: isShowType(building.type) && !gathering && !inGatheringCooldown(building, now),
  };
}

export const attractionRowOf = (state: GameState, building: Building): AttractionRow => rowOf(state, building, touristModesOf(state, building.id), cityDrawOf(state));

// The best a Show could earn now at this Attraction, net of what it costs.
function bestShowNet(state: GameState, building: Building): number {
  if (building.type !== 'concertHall') {
    const preview = previewGathering(state, building);
    return preview.revenue - preview.cost;
  }
  return Math.max(...artistOffer(state, building).map(artist => {
    const preview = previewGathering(state, building, artist);
    return preview.revenue - preview.cost;
  }));
}

function adviceOf(state: GameState, rows: readonly AttractionRow[], places: number, hotels: number): TourismAdvice[] {
  const advice: TourismAdvice[] = [];
  const full = rows.filter(row => row.full);
  if (full[0]) advice.push({ kind: 'collect', buildingId: full[0].building.id, count: full.length });
  const shows = rows.filter(row => row.canHoldShow).map(row => ({ row, net: bestShowNet(state, row.building) })).filter(show => show.net > 0).sort((a, b) => b.net - a.net);
  if (shows[0]) advice.push({ kind: 'show', buildingId: shows[0].row.building.id, net: shows[0].net });
  if (hotels === 0) advice.push({ kind: 'hotel' });
  if (places < HOTEL.attractiveCount) advice.push({ kind: 'attractiveness', missing: HOTEL.attractiveCount - places });
  const onlyByCar = rows.filter(row => row.modes.car > 0 && row.modes.walk === 0 && row.modes.transit === 0);
  if (onlyByCar[0]) advice.push({ kind: 'station', buildingId: onlyByCar[0].building.id, count: onlyByCar.length });
  return advice;
}

export function tourismOverview(state: GameState): TourismOverview {
  const modesById = new Map<number, TouristModes>();
  for (const flow of congestionStats(state).touristFlows) {
    const modes = modesById.get(flow.to) ?? { car: 0, walk: 0, transit: 0 };
    modes[flow.mode] += flow.count;
    modesById.set(flow.to, modes);
  }
  const draw = cityDrawOf(state);
  const attractions = state.buildings.filter(isAttraction).map(building => rowOf(state, building, modesById.get(building.id) ?? { car: 0, walk: 0, transit: 0 }, draw));
  const places = attractivePlaces(state);
  const hotels = state.buildings.filter(building => building.type === 'hotel').length;
  return {
    attractions: [...attractions].sort((a, b) => b.takings / Math.max(1, b.cap) - a.takings / Math.max(1, a.cap)),
    touristsPerDay: attractions.reduce((total, row) => total + row.tourists, 0),
    perHour: attractions.reduce((total, row) => total + row.perHour, 0),
    toCollect: attractions.reduce((total, row) => total + Math.floor(row.takings), 0),
    attractiveness: draw.attractiveness,
    places,
    placesGoal: HOTEL.attractiveCount,
    hotels,
    spending: draw.spending,
    gatherings: attractions.filter(row => row.gathering).sort((a, b) => a.gathering!.startsAt - b.gathering!.startsAt),
    advice: attractions.length === 0 ? [] : adviceOf(state, attractions, places, hotels),
  };
}

// The first Attraction to aim for: the cheapest of those unlocked and not built yet, else the next to unlock.
export function nextAttractionType(state: GameState): BuildingId | null {
  const citizens = totalCitizens(state);
  const built = new Set<string>(state.buildings.map(building => building.type));
  const candidates = BUILDING_ENTRIES.filter(entry => (entry.attraction ?? 0) > 0 && !entry.retired && !built.has(entry.id));
  const unlockOf = (entry: (typeof candidates)[number]) => entry.unlockCitizens ?? 0;
  const unlocked = candidates.filter(entry => unlockOf(entry) <= citizens).sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0));
  const next = unlocked[0] ?? [...candidates].sort((a, b) => unlockOf(a) - unlockOf(b))[0];
  return next?.id ?? null;
}
