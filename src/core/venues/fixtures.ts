import type { FixtureId, VenueType } from '../engine/state';

export interface FixtureSpec {
  venue: VenueType;
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
}

const arcade = (spec: Omit<FixtureSpec, 'venue'>): FixtureSpec => ({ venue: 'arcade', ...spec });
const supermarket = (spec: Omit<FixtureSpec, 'venue' | 'playsPerHour'>): FixtureSpec => ({ venue: 'supermarket', playsPerHour: 0, ...spec });
const hotel = (spec: Omit<FixtureSpec, 'venue' | 'playsPerHour'>): FixtureSpec => ({ venue: 'hotel', playsPerHour: 0, ...spec });

export const FIXTURES: Record<FixtureId, FixtureSpec> = {
  counter: arcade({ model: 'mini-arcade/cash-register', footprint: [1, 1], price: 100, minTier: 1, playsPerHour: 0 }),
  barrelClimber: arcade({ model: 'mini-arcade/arcade-machine', footprint: [1, 1], price: 150, minTier: 1, playsPerHour: 6, loud: true }),
  spaceShooter: arcade({ model: 'mini-arcade/arcade-machine', footprint: [1, 1], price: 180, minTier: 1, playsPerHour: 8, tint: 0x8fb4ff, loud: true }),
  airHockey: arcade({ model: 'mini-arcade/air-hockey', footprint: [1, 1], price: 220, minTier: 1, playsPerHour: 4, loud: true }),
  table: arcade({ model: 'furniture/table', footprint: [1, 1], price: 60, minTier: 1, playsPerHour: 0 }),
  chair: arcade({ model: 'furniture/chair', footprint: [1, 1], price: 25, minTier: 1, playsPerHour: 0 }),
  barStool: arcade({ model: 'furniture/stoolBar', footprint: [1, 1], price: 30, minTier: 1, playsPerHour: 0 }),
  pinball: arcade({ model: 'mini-arcade/pinball', footprint: [1, 1], price: 300, minTier: 2, playsPerHour: 6, loud: true }),
  billiard: arcade({ model: 'poly.pizza/pool-table', footprint: [2, 1], price: 350, minTier: 2, playsPerHour: 3 }),
  vendingMachine: arcade({ model: 'mini-arcade/vending-machine', footprint: [1, 1], price: 200, minTier: 2, playsPerHour: 0 }),
  clawMachine: arcade({ model: 'mini-arcade/claw-machine', footprint: [1, 1], price: 320, minTier: 2, playsPerHour: 5 }),
  basketball: arcade({ model: 'mini-arcade/basketball-game', footprint: [1, 1], price: 400, minTier: 3, playsPerHour: 6, loud: true }),
  danceMachine: arcade({ model: 'mini-arcade/dance-machine', footprint: [1, 1], price: 500, minTier: 3, playsPerHour: 8, loud: true }),
  prizeWheel: arcade({ model: 'mini-arcade/prize-wheel', footprint: [1, 1], price: 450, minTier: 3, playsPerHour: 5 }),
  ticketMachine: arcade({ model: 'mini-arcade/ticket-machine', footprint: [1, 1], price: 350, minTier: 3, playsPerHour: 0 }),

  checkout: supermarket({ model: 'mini-market/cash-register', footprint: [1, 1], price: 100, minTier: 1, checkout: 20, wear: 0.1 }),
  shelfBags: supermarket({ model: 'mini-market/shelf-bags', footprint: [1, 1], price: 120, minTier: 1, shelf: 12, wear: 0.02 }),
  shelfBoxes: supermarket({ model: 'mini-market/shelf-boxes', footprint: [1, 1], price: 120, minTier: 1, shelf: 12, wear: 0.02 }),
  displayBread: supermarket({ model: 'mini-market/display-bread', footprint: [1, 1], price: 150, minTier: 1, shelf: 8, wear: 0.02 }),
  displayFruit: supermarket({ model: 'mini-market/display-fruit', footprint: [1, 1], price: 150, minTier: 1, shelf: 8, wear: 0.02 }),
  freezer: supermarket({ model: 'mini-market/freezer', footprint: [1, 1], price: 300, minTier: 2, shelf: 16, wear: 0.05 }),
  freezerStanding: supermarket({ model: 'mini-market/freezers-standing', footprint: [1, 1], price: 380, minTier: 3, shelf: 20, wear: 0.05 }),
  shoppingBasket: supermarket({ model: 'mini-market/shopping-basket', footprint: [1, 1], price: 15, minTier: 1, attract: 0.02 }),
  shoppingCart: supermarket({ model: 'mini-market/shopping-cart', footprint: [1, 1], price: 30, minTier: 1, attract: 0.03 }),
  bottleReturn: supermarket({ model: 'mini-market/bottle-return', footprint: [1, 1], price: 200, minTier: 2, attract: 0.06 }),

  receptionDesk: hotel({ model: 'furniture/desk', footprint: [1, 1], price: 150, minTier: 1, reception: true }),
  singleBed: hotel({ model: 'furniture/bedSingle', footprint: [1, 2], price: 200, minTier: 1, sleeps: 1, wear: 0.05 }),
  doubleBed: hotel({ model: 'furniture/bedDouble', footprint: [2, 2], price: 380, minTier: 1, sleeps: 2, wear: 0.05 }),
  bunkBed: hotel({ model: 'furniture/bedBunk', footprint: [1, 2], price: 280, minTier: 2, sleeps: 2, wear: 0.05 }),
  toilet: hotel({ model: 'furniture/toilet', footprint: [1, 1], price: 120, minTier: 1, bath: 1, wear: 0.05 }),
  shower: hotel({ model: 'furniture/shower', footprint: [1, 1], price: 220, minTier: 1, bath: 1, wear: 0.05 }),
  bathtub: hotel({ model: 'furniture/bathtub', footprint: [2, 1], price: 300, minTier: 2, bath: 2, wear: 0.05 }),
  sofa: hotel({ model: 'furniture/loungeSofa', footprint: [1, 1], price: 140, minTier: 1, comfort: 1 }),
  television: hotel({ model: 'furniture/televisionModern', footprint: [1, 1], price: 160, minTier: 2, comfort: 1 }),
  floorLamp: hotel({ model: 'furniture/lampRoundFloor', footprint: [1, 1], price: 40, minTier: 1, comfort: 0.5 }),
  rug: hotel({ model: 'furniture/rugRectangle', footprint: [2, 1], price: 60, minTier: 1, comfort: 0.5 }),
  pottedPlant: hotel({ model: 'furniture/pottedPlant', footprint: [1, 1], price: 35, minTier: 1, comfort: 0.5 }),
  coffeeCorner: hotel({ model: 'furniture/kitchenCoffeeMachine', footprint: [1, 1], price: 180, minTier: 2, comfort: 1.5 }),
  miniFridge: hotel({ model: 'furniture/kitchenFridgeSmall', footprint: [1, 1], price: 220, minTier: 3, comfort: 1.5 }),
};

export const FIXTURE_IDS = Object.keys(FIXTURES) as FixtureId[];

export const fixtureIdsOf = (venue: VenueType): FixtureId[] => FIXTURE_IDS.filter(id => FIXTURES[id].venue === venue);

export const FIXTURE_MODELS: readonly string[] = [...new Set(Object.values(FIXTURES).map(spec => spec.model))];
