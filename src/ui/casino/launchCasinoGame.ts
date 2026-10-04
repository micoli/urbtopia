import type { CasinoGame } from '../../core';
import { casinoStore } from '../../store/casinoStore';

export function launchCasinoGame(casinoId: number, game: CasinoGame, closePanel: () => void) {
  casinoStore.getState().play(casinoId, game);
  closePanel();
}
