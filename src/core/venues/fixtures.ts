import type { FixtureId, VenueType } from '../engine/state';

export type FixtureCategory = 'games' | 'service' | 'furniture' | 'shelves' | 'checkouts' | 'decor' | 'beds' | 'bathroom' | 'comfort' | 'reception' | 'walls';

// The sections of the build menu of each kind of Venue, in order.
export const FIXTURE_CATEGORIES: Record<VenueType, readonly FixtureCategory[]> = {
  arcade: ['games', 'service', 'furniture', 'walls'],
  supermarket: ['shelves', 'checkouts', 'decor', 'walls'],
  hotel: ['beds', 'bathroom', 'comfort', 'reception', 'walls'],
};

export interface FixtureSpec {
  venue: VenueType;
  category: FixtureCategory;
  model: string;
  footprint: readonly [number, number];
  price: number;
  minTier: number;
  // Arcade: plays per hour of a game.
  playsPerHour: number;
  tint?: number;
  loud?: true;
  // Share of the wear that the use of the Fixture causes; 1 when left out.
  wear?: number;
  // Supermarket: units a shelf holds, and shoppers a checkout serves per hour.
  shelf?: number;
  checkout?: number;
  // Hotel: reception desk, guests a bed sleeps, rooms a bathroom piece serves, comfort points of an extra.
  reception?: true;
  sleeps?: number;
  bath?: number;
  comfort?: number;
  // Decoration: attractiveness it adds.
  attract?: number;
  // A wall: it only divides the room, and earns, serves and wears nothing.
  partition?: true;
}

const arcade = (spec: Omit<FixtureSpec, 'venue'>): FixtureSpec => ({ venue: 'arcade', ...spec });
const supermarket = (spec: Omit<FixtureSpec, 'venue' | 'playsPerHour'>): FixtureSpec => ({ venue: 'supermarket', playsPerHour: 0, ...spec });
const hotel = (spec: Omit<FixtureSpec, 'venue' | 'playsPerHour'>): FixtureSpec => ({ venue: 'hotel', playsPerHour: 0, ...spec });

export const FIXTURES: Record<FixtureId, FixtureSpec> = {
  counter: arcade({ category: 'service', model: 'mini-arcade/cash-register', footprint: [1, 1], price: 100, minTier: 1, playsPerHour: 0 }),
  barrelClimber: arcade({ category: 'games', model: 'mini-arcade/arcade-machine', footprint: [1, 1], price: 150, minTier: 1, playsPerHour: 6, loud: true }),
  spaceShooter: arcade({ category: 'games', model: 'mini-arcade/arcade-machine', footprint: [1, 1], price: 180, minTier: 1, playsPerHour: 8, tint: 0x8fb4ff, loud: true }),
  airHockey: arcade({ category: 'games', model: 'mini-arcade/air-hockey', footprint: [1, 1], price: 220, minTier: 1, playsPerHour: 4, loud: true }),
  table: arcade({ category: 'furniture', model: 'furniture/table', footprint: [1, 1], price: 60, minTier: 1, playsPerHour: 0 }),
  chair: arcade({ category: 'furniture', model: 'furniture/chair', footprint: [1, 1], price: 25, minTier: 1, playsPerHour: 0 }),
  barStool: arcade({ category: 'furniture', model: 'furniture/stoolBar', footprint: [1, 1], price: 30, minTier: 1, playsPerHour: 0 }),
  pinball: arcade({ category: 'games', model: 'mini-arcade/pinball', footprint: [1, 1], price: 300, minTier: 2, playsPerHour: 6, loud: true }),
  billiard: arcade({ category: 'games', model: 'poly.pizza/pool-table', footprint: [2, 1], price: 350, minTier: 2, playsPerHour: 3 }),
  vendingMachine: arcade({ category: 'service', model: 'mini-arcade/vending-machine', footprint: [1, 1], price: 200, minTier: 2, playsPerHour: 0 }),
  clawMachine: arcade({ category: 'games', model: 'mini-arcade/claw-machine', footprint: [1, 1], price: 320, minTier: 2, playsPerHour: 5 }),
  basketball: arcade({ category: 'games', model: 'mini-arcade/basketball-game', footprint: [1, 1], price: 400, minTier: 3, playsPerHour: 6, loud: true }),
  danceMachine: arcade({ category: 'games', model: 'mini-arcade/dance-machine', footprint: [1, 1], price: 500, minTier: 3, playsPerHour: 8, loud: true }),
  prizeWheel: arcade({ category: 'games', model: 'mini-arcade/prize-wheel', footprint: [1, 1], price: 450, minTier: 3, playsPerHour: 5 }),
  arcadeWall: arcade({ category: 'walls', model: 'mini-arcade/wall', footprint: [1, 1], price: 40, minTier: 1, playsPerHour: 0, partition: true }),
  arcadeWindow: arcade({ category: 'walls', model: 'mini-arcade/wall-window', footprint: [1, 1], price: 60, minTier: 1, playsPerHour: 0, partition: true }),
  ticketMachine: arcade({ category: 'service', model: 'mini-arcade/ticket-machine', footprint: [1, 1], price: 350, minTier: 3, playsPerHour: 0 }),

  checkout: supermarket({ category: 'checkouts', model: 'mini-market/cash-register', footprint: [1, 1], price: 100, minTier: 1, checkout: 20, wear: 0.1 }),
  shelfBags: supermarket({ category: 'shelves', model: 'mini-market/shelf-bags', footprint: [1, 1], price: 120, minTier: 1, shelf: 12, wear: 0.02 }),
  shelfBoxes: supermarket({ category: 'shelves', model: 'mini-market/shelf-boxes', footprint: [1, 1], price: 120, minTier: 1, shelf: 12, wear: 0.02 }),
  displayBread: supermarket({ category: 'shelves', model: 'mini-market/display-bread', footprint: [1, 1], price: 150, minTier: 1, shelf: 8, wear: 0.02 }),
  displayFruit: supermarket({ category: 'shelves', model: 'mini-market/display-fruit', footprint: [1, 1], price: 150, minTier: 1, shelf: 8, wear: 0.02 }),
  freezer: supermarket({ category: 'shelves', model: 'mini-market/freezer', footprint: [1, 1], price: 300, minTier: 2, shelf: 16, wear: 0.05 }),
  freezerStanding: supermarket({ category: 'shelves', model: 'mini-market/freezers-standing', footprint: [1, 1], price: 380, minTier: 3, shelf: 20, wear: 0.05 }),
  shoppingBasket: supermarket({ category: 'decor', model: 'mini-market/shopping-basket', footprint: [1, 1], price: 15, minTier: 1, attract: 0.02 }),
  shoppingCart: supermarket({ category: 'decor', model: 'mini-market/shopping-cart', footprint: [1, 1], price: 30, minTier: 1, attract: 0.03 }),
  marketWall: supermarket({ category: 'walls', model: 'mini-market/wall', footprint: [1, 1], price: 40, minTier: 1, partition: true }),
  marketWindow: supermarket({ category: 'walls', model: 'mini-market/wall-window', footprint: [1, 1], price: 60, minTier: 1, partition: true }),
  bottleReturn: supermarket({ category: 'decor', model: 'mini-market/bottle-return', footprint: [1, 1], price: 200, minTier: 2, attract: 0.06 }),

  receptionDesk: hotel({ category: 'reception', model: 'furniture/desk', footprint: [1, 1], price: 150, minTier: 1, reception: true }),
  singleBed: hotel({ category: 'beds', model: 'furniture/bedSingle', footprint: [1, 2], price: 200, minTier: 1, sleeps: 1, wear: 0.05 }),
  doubleBed: hotel({ category: 'beds', model: 'furniture/bedDouble', footprint: [2, 2], price: 380, minTier: 1, sleeps: 2, wear: 0.05 }),
  bunkBed: hotel({ category: 'beds', model: 'furniture/bedBunk', footprint: [1, 2], price: 280, minTier: 2, sleeps: 2, wear: 0.05 }),
  toilet: hotel({ category: 'bathroom', model: 'furniture/toilet', footprint: [1, 1], price: 120, minTier: 1, bath: 1, wear: 0.05 }),
  shower: hotel({ category: 'bathroom', model: 'furniture/shower', footprint: [1, 1], price: 220, minTier: 1, bath: 1, wear: 0.05 }),
  bathtub: hotel({ category: 'bathroom', model: 'furniture/bathtub', footprint: [2, 1], price: 300, minTier: 2, bath: 2, wear: 0.05 }),
  sofa: hotel({ category: 'comfort', model: 'furniture/loungeSofa', footprint: [1, 1], price: 140, minTier: 1, comfort: 1 }),
  television: hotel({ category: 'comfort', model: 'furniture/televisionModern', footprint: [1, 1], price: 160, minTier: 2, comfort: 1 }),
  floorLamp: hotel({ category: 'comfort', model: 'furniture/lampRoundFloor', footprint: [1, 1], price: 40, minTier: 1, comfort: 0.5 }),
  rug: hotel({ category: 'comfort', model: 'furniture/rugRectangle', footprint: [2, 1], price: 60, minTier: 1, comfort: 0.5 }),
  pottedPlant: hotel({ category: 'comfort', model: 'furniture/pottedPlant', footprint: [1, 1], price: 35, minTier: 1, comfort: 0.5 }),
  coffeeCorner: hotel({ category: 'comfort', model: 'furniture/kitchenCoffeeMachine', footprint: [1, 1], price: 180, minTier: 2, comfort: 1.5 }),
  hotelWall: hotel({ category: 'walls', model: 'furniture/wall', footprint: [1, 1], price: 40, minTier: 1, partition: true }),
  hotelWindow: hotel({ category: 'walls', model: 'furniture/wallWindow', footprint: [1, 1], price: 60, minTier: 1, partition: true }),
  miniFridge: hotel({ category: 'comfort', model: 'furniture/kitchenFridgeSmall', footprint: [1, 1], price: 220, minTier: 3, comfort: 1.5 }),
};

export const FIXTURE_IDS = Object.keys(FIXTURES) as FixtureId[];

export const fixtureIdsOf = (venue: VenueType): FixtureId[] => FIXTURE_IDS.filter(id => FIXTURES[id].venue === venue);

export const fixtureIdsInCategory = (venue: VenueType, category: FixtureCategory): FixtureId[] => fixtureIdsOf(venue).filter(id => FIXTURES[id].category === category);

export const FIXTURE_MODELS: readonly string[] = [...new Set(Object.values(FIXTURES).map(spec => spec.model))];
