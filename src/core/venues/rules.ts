import type { Layout } from './layout';
import type { Building, GameState, VenueData } from '../engine/state';

export interface RuleContext {
  // The Venue as seen by the rules: its broken Fixtures are left out.
  working: VenueData;
  price: number;
  // Visitors multiplier of a running event.
  surge: number;
}

export interface RoomReport {
  rooms: number;
  valid: number;
  occupied: number;
  standing: number;
  cleanliness: number;
}

export interface Evaluation {
  visitors: number;
  accepted: number;
  capacity: number;
  served: number;
  // Earnings per hour, before the manager yield.
  gross: number;
  earnings: Map<number, number>;
  // Use per hour of each Fixture: plays, units sold or room occupancy. It drives the wear.
  usage: Map<number, number>;
  layout: Layout;
  // Supermarket: units sold per hour by shelf.
  sales: Map<number, number>;
  // Hotel.
  rooms?: RoomReport;
  reputationTarget?: number;
}

export type Evaluate = (state: GameState, venue: Building & { venue: VenueData }, context: RuleContext) => Evaluation;

export const emptyLayout = (attractiveness = 1): Layout => ({ counterRate: 1, attractiveness, seatedIds: new Set(), hints: new Map() });
