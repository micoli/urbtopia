import type { CasinoGame } from '../../core';

const ICON_FILES: Record<CasinoGame, string> = {
  slotMachine: 'casino-slotmachine.png',
  blackjack: 'casino-blackjack.png',
  blockmatch: 'casino-blockmatch.png',
};

export const casinoGameIconUrl = (game: CasinoGame): string => `${import.meta.env.BASE_URL}assets/icons/${ICON_FILES[game]}`;
