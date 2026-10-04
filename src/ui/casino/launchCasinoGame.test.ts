import { describe, expect, it, vi } from 'vitest';
import { casinoStore } from '../../store/casinoStore';
import { launchCasinoGame } from './launchCasinoGame';

describe('launching a casino game', () => {
  it('opens the game and closes the casino panel', () => {
    const closePanel = vi.fn();
    launchCasinoGame(7, 'blackjack', closePanel);
    expect(casinoStore.getState()).toMatchObject({ casinoId: 7, game: 'blackjack' });
    expect(closePanel).toHaveBeenCalledTimes(1);
    casinoStore.getState().close();
  });
});
