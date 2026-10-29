import type { CommandOutcome } from '../engine/commands';
import type { Building, GameState } from '../engine/state';
import { cityAttractiveness } from '../venues/hotel';
import { attractionPowerOf, isAttraction, spendingFactor } from './tourists';

export const TICKETS = [
  { price: 4, draw: 1 },
  { price: 8, draw: 0.75 },
  { price: 14, draw: 0.5 },
] as const;

export const TICKET_DEFAULT = 1;

export const TAKINGS = {
  hourMs: 3_600_000,
  hoursPerDay: 24,
  capPerPower: 20,
};

const tierOf = (building: Pick<Building, 'attraction'>) => TICKETS[ticketOf(building)] ?? TICKETS[TICKET_DEFAULT];

export const ticketOf = (building: Pick<Building, 'attraction'>): number => building.attraction?.ticket ?? TICKET_DEFAULT;

export const attractionTakingsCapOf = (building: Pick<Building, 'type' | 'tier'>): number => Math.floor(attractionPowerOf(building) * TAKINGS.capPerPower);

export const takingsOf = (building: Pick<Building, 'attraction'>): number => building.attraction?.takings ?? 0;

export const touristsPerDay = (building: Pick<Building, 'type' | 'tier' | 'attraction'>, attractiveness: number): number =>
  attractionPowerOf(building) * attractiveness * tierOf(building).draw;

// Urbs an Attraction earns per hour at its Ticket, before the cap.
export const earningsPerHour = (building: Pick<Building, 'type' | 'tier' | 'attraction'>, attractiveness: number, spending: number): number =>
  (touristsPerDay(building, attractiveness) / TAKINGS.hoursPerDay) * tierOf(building).price * spending;

export function advanceAttractions(state: GameState, from: number, to: number): GameState {
  if (to <= from || !state.buildings.some(isAttraction)) return state;
  const hours = (to - from) / TAKINGS.hourMs;
  const attractiveness = cityAttractiveness(state);
  const spending = spendingFactor(state);
  const buildings = state.buildings.map(building => {
    if (!isAttraction(building)) return building;
    const held = takingsOf(building);
    const takings = Math.max(held, Math.min(attractionTakingsCapOf(building), held + earningsPerHour(building, attractiveness, spending) * hours));
    return { ...building, attraction: { ...building.attraction, takings } };
  });
  return { ...state, buildings };
}

export function setTicket(state: GameState, buildingId: number, level: number): CommandOutcome {
  const building = state.buildings.find(candidate => candidate.id === buildingId);
  if (!building) return { key: 'error.unknownBuilding' };
  if (!isAttraction(building)) return { key: 'error.unknownCommand' };
  if (!Number.isInteger(level) || level < 0 || level >= TICKETS.length) return { key: 'error.invalidPrice' };
  const attraction = { takings: takingsOf(building), ...building.attraction, ticket: level };
  return { state: { ...state, buildings: state.buildings.map(candidate => (candidate === building ? { ...building, attraction } : candidate)) }, events: [] };
}

export function collectAttractionTakings(state: GameState, building: Building): CommandOutcome {
  const due = Math.floor(takingsOf(building));
  if (due === 0) return { key: 'error.nothingToCollect' };
  const attraction = { ...building.attraction, takings: takingsOf(building) - due };
  return {
    state: { ...state, urbs: state.urbs + due, buildings: state.buildings.map(candidate => (candidate === building ? { ...building, attraction } : candidate)) },
    events: [{ type: 'ItemsCollected', buildingId: building.id }],
  };
}
