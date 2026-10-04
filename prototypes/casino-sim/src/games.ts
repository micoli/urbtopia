import { CASINO, type CasinoGame } from '../../../src/core';

export interface SimGame {
  game: CasinoGame;
  path: string;
  minTier: number;
}

export const SIM_GAMES: readonly SimGame[] = [
  { game: 'slotMachine', path: '/slot-machine', minTier: CASINO.gameMinTier.slotMachine },
  { game: 'blackjack', path: '/blackjack', minTier: CASINO.gameMinTier.blackjack },
  { game: 'blockmatch', path: '/blockmatch', minTier: CASINO.gameMinTier.blockmatch },
];

export function simGameAt(pathname: string): SimGame | null {
  return SIM_GAMES.find(entry => entry.path === pathname.replace(/\/$/, '')) ?? null;
}
