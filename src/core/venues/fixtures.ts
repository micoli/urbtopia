import type { ArcadeFixtureId } from '../engine/state';

export interface FixtureSpec {
  model: string;
  footprint: readonly [number, number];
  price: number;
  minTier: number;
  playsPerHour: number;
  tint?: number;
  loud?: true;
}

export const ARCADE_FIXTURES: Record<ArcadeFixtureId, FixtureSpec> = {
  counter: { model: 'mini-arcade/cash-register', footprint: [1, 1], price: 100, minTier: 1, playsPerHour: 0 },
  barrelClimber: { model: 'mini-arcade/arcade-machine', footprint: [1, 1], price: 150, minTier: 1, playsPerHour: 6, loud: true },
  spaceShooter: { model: 'mini-arcade/arcade-machine', footprint: [1, 1], price: 180, minTier: 1, playsPerHour: 8, tint: 0x8fb4ff, loud: true },
  airHockey: { model: 'mini-arcade/air-hockey', footprint: [1, 1], price: 220, minTier: 1, playsPerHour: 4, loud: true },
  table: { model: 'furniture/table', footprint: [1, 1], price: 60, minTier: 1, playsPerHour: 0 },
  chair: { model: 'furniture/chair', footprint: [1, 1], price: 25, minTier: 1, playsPerHour: 0 },
  barStool: { model: 'furniture/stoolBar', footprint: [1, 1], price: 30, minTier: 1, playsPerHour: 0 },
  pinball: { model: 'mini-arcade/pinball', footprint: [1, 1], price: 300, minTier: 2, playsPerHour: 6, loud: true },
  billiard: { model: 'poly.pizza/pool-table', footprint: [2, 1], price: 350, minTier: 2, playsPerHour: 3 },
  vendingMachine: { model: 'mini-arcade/vending-machine', footprint: [1, 1], price: 200, minTier: 2, playsPerHour: 0 },
  clawMachine: { model: 'mini-arcade/claw-machine', footprint: [1, 1], price: 320, minTier: 2, playsPerHour: 5 },
  basketball: { model: 'mini-arcade/basketball-game', footprint: [1, 1], price: 400, minTier: 3, playsPerHour: 6, loud: true },
  danceMachine: { model: 'mini-arcade/dance-machine', footprint: [1, 1], price: 500, minTier: 3, playsPerHour: 8, loud: true },
  prizeWheel: { model: 'mini-arcade/prize-wheel', footprint: [1, 1], price: 450, minTier: 3, playsPerHour: 5 },
  ticketMachine: { model: 'mini-arcade/ticket-machine', footprint: [1, 1], price: 350, minTier: 3, playsPerHour: 0 },
};

export const ARCADE_FIXTURE_IDS = Object.keys(ARCADE_FIXTURES) as ArcadeFixtureId[];
