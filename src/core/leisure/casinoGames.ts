export const CASINO_GAMES = ['slotMachine', 'blackjack', 'blockmatch'] as const;

export type CasinoGame = (typeof CASINO_GAMES)[number];
