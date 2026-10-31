import type { CommandOutcome } from '../engine/commands';
import type { GameEvent } from '../engine/events';
import type { Building, GameState, GatheringData } from '../engine/state';
import { citizensOf } from '../buildings/city';
import { definitionOf } from '../buildings/buildingDefinitions';
import { centerOf } from '../environment/ecology';
import { isHomeType } from '../buildings/buildingDefinitions';
import { isWithinReach } from '../services/facilities';
import { cityWellbeingRatio } from './cityWellbeing';
import { artistOffer, feeOfArtist, qualityOfFame, ticketBoostOfFame } from './artists';
import type { Artist } from './artistSchema';
import { CROWD_WINDOW_MS, GATHERING_REACH } from './gatheringWindow';
import { TICKETS, TAKINGS, takingsOf, ticketOf } from './takings';
import { TOURISM, isArenaType, spendingFactor } from './tourists';
import { cityAttractiveness } from '../venues/hotel';

export const SHOW_TYPES = ['theater', 'concertHall', 'colosseum'] as const;

export const GATHERING = {
  durationMs: 3 * TAKINGS.hourMs,
  matchDurationMs: 2 * TAKINGS.hourMs,
  windowMs: CROWD_WINDOW_MS,
  maxMalus: 5,
  cooldownMs: 12 * TAKINGS.hourMs,
  cancelRefund: 0.5,
  maxDelayHours: 24,
  costPerSeat: 0.4,
  baseFill: 0.3,
  qualityFill: 0.5,
  wellbeingFill: 0.2,
  touristShare: 0.5,
  citizenShare: 0.5,
  reach: GATHERING_REACH,
  defaultQuality: 0.5,
  capacity: { theater: 150, concertHall: 400, colosseum: 1200, stadium: 600, footballStadium: 3000, baseballField: 1200 } as Readonly<Record<string, number>>,
  meetingCapacity: 600,
  meetingQuality: 0.5,
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));


export const isShowType = (type: string): boolean => (SHOW_TYPES as readonly string[]).includes(type);

export const isStadiumType = (type: string): boolean => isArenaType(type) && !isShowType(type);

export const gatheringCapacityOf = (building: Pick<Building, 'type' | 'tier'>): number => {
  const base = GATHERING.capacity[building.type] ?? 0;
  return Math.floor(base * (1 + TOURISM.tierBonus * (building.tier - 1)));
};

export const gatheringCostOf = (building: Pick<Building, 'type' | 'tier'>): number => Math.ceil(gatheringCapacityOf(building) * GATHERING.costPerSeat);

const citizensInReach = (state: GameState, building: Building): number => {
  const radius = definitionOf(building.type).radius ?? GATHERING.reach;
  const from = centerOf(building);
  return state.buildings.reduce((total, home) => {
    if (!isHomeType(home.type)) return total;
    const to = centerOf(home);
    return total + (isWithinReach(to.x - from.x, to.y - from.y, radius) ? citizensOf(home.tier) : 0);
  }, 0);
};

export type GatheringPreview = Pick<GatheringData, 'cost' | 'crowd' | 'tourists' | 'citizens' | 'revenue'>;

export interface GatheringDraw {
  quality?: number;
  capacity?: number;
  crowdBoost?: number;
}

export const MEETING_DRAW: GatheringDraw = { quality: GATHERING.meetingQuality, capacity: GATHERING.meetingCapacity };

// The crowd a Gathering would draw now: capacity x fill, split between Tourists and the Citizens in reach.
export function previewGathering(state: GameState, building: Building, artist?: Artist, draw: GatheringDraw = {}): GatheringPreview {
  const quality = draw.quality ?? (artist ? qualityOfFame(artist.fame) : GATHERING.defaultQuality);
  const fill = Math.min(1, clamp01(GATHERING.baseFill + GATHERING.qualityFill * quality + GATHERING.wellbeingFill * cityWellbeingRatio(state)) * (TICKETS[ticketOf(building)]?.draw ?? 1) * (draw.crowdBoost ?? 1));
  const crowd = (draw.capacity ?? gatheringCapacityOf(building)) * fill;
  const tourists = Math.min(crowd, crowd * GATHERING.touristShare * cityAttractiveness(state));
  const citizens = Math.min(crowd - tourists, citizensInReach(state, building) * GATHERING.citizenShare);
  const present = tourists + citizens;
  const price = TICKETS[ticketOf(building)]?.price ?? 0;
  const boost = artist ? ticketBoostOfFame(artist.fame) : 1;
  return { cost: gatheringCostOf(building) + (artist ? feeOfArtist(artist) : 0), crowd: present, tourists, citizens, revenue: present * price * boost * spendingFactor(state) };
}

export const isGatheringActive = (building: Pick<Building, 'attraction'>, now: number): boolean => {
  const gathering = building.attraction?.gathering;
  return gathering !== undefined && gathering.startsAt <= now && now < gathering.endsAt;
};

export const inGatheringCooldown = (building: Pick<Building, 'attraction'>, now: number): boolean => now < (building.attraction?.cooldownUntil ?? 0);

export function scheduleShow(state: GameState, buildingId: number, startsInHours: number, artistId?: string): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  if (!isShowType(building.type)) return { key: 'error.unknownCommand' };
  if (!Number.isInteger(startsInHours) || startsInHours < 0 || startsInHours > GATHERING.maxDelayHours) return { key: 'error.invalidEventStart' };
  if (building.attraction?.gathering) return { key: 'error.eventBusy' };
  if (inGatheringCooldown(building, state.lastSeen)) return { key: 'error.eventCooldown' };
  const needsArtist = building.type === 'concertHall';
  const artist = artistId === undefined ? undefined : artistOffer(state, building).find(offered => offered.id === artistId);
  if (needsArtist ? artist === undefined : artistId !== undefined) return { key: 'error.invalidArtist' };
  const preview = previewGathering(state, building, artist);
  if (state.urbs < preview.cost) return { key: 'error.notEnoughUrbs' };
  const startsAt = state.lastSeen + startsInHours * TAKINGS.hourMs;
  const gathering: GatheringData = { kind: 'show', startsAt, endsAt: startsAt + GATHERING.durationMs, quality: artist ? qualityOfFame(artist.fame) : GATHERING.defaultQuality, ...(artist ? { artist: artist.id } : {}), ...preview };
  const attraction = { ...building.attraction, takings: takingsOf(building), gathering, shows: (building.attraction?.shows ?? 0) + 1 };
  // A Show that starts at once has no later step to announce it.
  const events: GameEvent[] = startsInHours === 0 ? [{ type: 'GatheringStarted', buildingId }] : [];
  return { state: { ...state, urbs: state.urbs - preview.cost, buildings: state.buildings.map(candidate => (candidate === building ? { ...building, attraction } : candidate)) }, events };
}

export function cancelShow(state: GameState, buildingId: number): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  const gathering = building.attraction?.gathering;
  if (!gathering || gathering.kind !== 'show') return { key: 'error.noEvent' };
  if (gathering.startsAt <= state.lastSeen) return { key: 'error.eventStarted' };
  const attraction = { ...building.attraction!, takings: takingsOf(building) };
  delete attraction.gathering;
  return { state: { ...state, urbs: state.urbs + Math.floor(gathering.cost * GATHERING.cancelRefund), buildings: state.buildings.map(candidate => (candidate === building ? { ...building, attraction } : candidate)) }, events: [] };
}

// Times after `after` at which a Gathering starts or ends, or its crowd starts or stops moving.
export function gatheringBoundaries(state: GameState, after: number): number[] {
  return state.buildings.flatMap(building => {
    const gathering = building.attraction?.gathering;
    if (!gathering) return [];
    return [gathering.startsAt - GATHERING.windowMs, gathering.startsAt, gathering.endsAt, gathering.endsAt + GATHERING.windowMs].filter(time => time > after);
  });
}

// A Gathering that starts or ends within the step is announced; one whose crowd has gone home pays its Ticket revenue into the Takings and starts the cooldown.
export function advanceGatherings(state: GameState, from: number, to: number): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  for (const building of state.buildings) {
    const gathering = building.attraction?.gathering;
    if (!gathering) continue;
    if (from < gathering.startsAt && gathering.startsAt <= to) events.push({ type: 'GatheringStarted', buildingId: building.id });
    if (from < gathering.endsAt && gathering.endsAt <= to) events.push({ type: 'GatheringEnded', buildingId: building.id });
  }
  if (!state.buildings.some(building => building.attraction?.gathering && building.attraction.gathering.endsAt + GATHERING.windowMs <= to)) return { state, events };
  const buildings = state.buildings.map(building => {
    const gathering = building.attraction?.gathering;
    if (!gathering || gathering.endsAt + GATHERING.windowMs > to) return building;
    const lastGathering = { kind: gathering.kind, at: gathering.endsAt, crowd: gathering.crowd, revenue: gathering.revenue, cost: gathering.cost, ...(gathering.artist ? { artist: gathering.artist } : {}) };
    const attraction = { ...building.attraction!, takings: takingsOf(building) + gathering.revenue, cooldownUntil: gathering.endsAt + GATHERING.cooldownMs, lastGathering };
    delete attraction.gathering;
    events.push({ type: 'GatheringSettled', buildingId: building.id, crowd: gathering.crowd, revenue: gathering.revenue });
    return { ...building, attraction };
  });
  return { state: { ...state, buildings }, events };
}

// A Match or Meeting set by a calendar: no cost to the player, the crowd drawn like a Show's. It uses up the boost of a Championship.
export function setGathering(state: GameState, building: Building, kind: 'match' | 'meeting', startsAt: number, draw: GatheringDraw): GameState {
  const preview = previewGathering(state, building, undefined, draw);
  const gathering: GatheringData = { kind, startsAt, endsAt: startsAt + GATHERING.matchDurationMs, quality: draw.quality ?? GATHERING.defaultQuality, ...preview, cost: 0 };
  const attraction = { ...building.attraction, takings: takingsOf(building), gathering };
  delete attraction.nextMatchBoost;
  return { ...state, buildings: state.buildings.map(candidate => (candidate === building ? { ...building, attraction } : candidate)) };
}
