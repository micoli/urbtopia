import type { CommandOutcome } from '../engine/commands';
import type { Building, GameState, GatheringData } from '../engine/state';
import { citizensOf } from '../buildings/city';
import { definitionOf } from '../buildings/buildingDefinitions';
import { centerOf } from '../environment/ecology';
import { cityBenefits } from '../environment/wellbeing';
import { isHomeType } from '../buildings/buildingDefinitions';
import { isWithinReach } from '../services/facilities';
import { TICKETS, TAKINGS, takingsOf, ticketOf } from './takings';
import { TOURISM, spendingFactor } from './tourists';
import { cityAttractiveness } from '../venues/hotel';

export const SHOW_TYPES = ['theater', 'concertHall', 'colosseum'] as const;

export const GATHERING = {
  durationMs: 3 * TAKINGS.hourMs,
  cooldownMs: 12 * TAKINGS.hourMs,
  maxDelayHours: 24,
  costPerSeat: 0.4,
  baseFill: 0.3,
  qualityFill: 0.5,
  wellbeingFill: 0.2,
  touristShare: 0.5,
  citizenShare: 0.5,
  reach: 14,
  defaultQuality: 0.5,
  capacity: { theater: 150, concertHall: 400, colosseum: 1200, stadium: 600, footballStadium: 3000, baseballField: 1200 } as Readonly<Record<string, number>>,
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const isShowType = (type: string): boolean => (SHOW_TYPES as readonly string[]).includes(type);

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

// The crowd a Gathering would draw now: capacity x fill, split between Tourists and the Citizens in reach.
export function previewGathering(state: GameState, building: Building, quality = GATHERING.defaultQuality): GatheringPreview {
  const wellbeing = clamp01(cityBenefits(state).wellbeing / 100);
  const fill = clamp01(GATHERING.baseFill + GATHERING.qualityFill * quality + GATHERING.wellbeingFill * wellbeing) * (TICKETS[ticketOf(building)]?.draw ?? 1);
  const crowd = gatheringCapacityOf(building) * fill;
  const tourists = Math.min(crowd, crowd * GATHERING.touristShare * cityAttractiveness(state));
  const citizens = Math.min(crowd - tourists, citizensInReach(state, building) * GATHERING.citizenShare);
  const present = tourists + citizens;
  const price = TICKETS[ticketOf(building)]?.price ?? 0;
  return { cost: gatheringCostOf(building), crowd: present, tourists, citizens, revenue: present * price * spendingFactor(state) };
}

export const isGatheringActive = (building: Pick<Building, 'attraction'>, now: number): boolean => {
  const gathering = building.attraction?.gathering;
  return gathering !== undefined && gathering.startsAt <= now && now < gathering.endsAt;
};

export const inGatheringCooldown = (building: Pick<Building, 'attraction'>, now: number): boolean => now < (building.attraction?.cooldownUntil ?? 0);

export function scheduleShow(state: GameState, buildingId: number, startsInHours: number, quality = GATHERING.defaultQuality): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  if (!isShowType(building.type)) return { key: 'error.unknownCommand' };
  if (!Number.isInteger(startsInHours) || startsInHours < 0 || startsInHours > GATHERING.maxDelayHours) return { key: 'error.invalidEventStart' };
  if (building.attraction?.gathering) return { key: 'error.eventBusy' };
  if (inGatheringCooldown(building, state.lastSeen)) return { key: 'error.eventCooldown' };
  const preview = previewGathering(state, building, quality);
  if (state.urbs < preview.cost) return { key: 'error.notEnoughUrbs' };
  const startsAt = state.lastSeen + startsInHours * TAKINGS.hourMs;
  const gathering: GatheringData = { kind: 'show', startsAt, endsAt: startsAt + GATHERING.durationMs, quality, ...preview };
  const attraction = { ...building.attraction, takings: takingsOf(building), gathering };
  return { state: { ...state, urbs: state.urbs - preview.cost, buildings: state.buildings.map(candidate => (candidate === building ? { ...building, attraction } : candidate)) }, events: [] };
}

// Times after `after` at which a Gathering starts or ends.
export function gatheringBoundaries(state: GameState, after: number): number[] {
  return state.buildings.flatMap(building => {
    const gathering = building.attraction?.gathering;
    return gathering ? [gathering.startsAt, gathering.endsAt].filter(time => time > after) : [];
  });
}

// A Gathering that has ended pays its Ticket revenue into the Takings and starts the cooldown.
export function advanceGatherings(state: GameState, to: number): GameState {
  if (!state.buildings.some(building => building.attraction?.gathering && building.attraction.gathering.endsAt <= to)) return state;
  const buildings = state.buildings.map(building => {
    const gathering = building.attraction?.gathering;
    if (!gathering || gathering.endsAt > to) return building;
    const attraction = { ...building.attraction!, takings: takingsOf(building) + gathering.revenue, cooldownUntil: gathering.endsAt + GATHERING.cooldownMs };
    delete attraction.gathering;
    return { ...building, attraction };
  });
  return { ...state, buildings };
}
