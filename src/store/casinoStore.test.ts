import { beforeEach, describe, expect, it } from 'vitest';
import { casinoStore } from './casinoStore';

beforeEach(() => casinoStore.getState().close());

describe('casino ledger', () => {
  it('adds up what was spent and what was won while a game is open', () => {
    casinoStore.getState().play(1, 'slotMachine');
    casinoStore.getState().record(10, 0);
    casinoStore.getState().record(10, 15);
    expect(casinoStore.getState()).toMatchObject({ spent: 20, won: 15 });
  });

  it('starts again from zero when a game is opened or left', () => {
    casinoStore.getState().play(1, 'blackjack');
    casinoStore.getState().record(50, 125);
    casinoStore.getState().play(1, 'blockmatch');
    expect(casinoStore.getState()).toMatchObject({ spent: 0, won: 0 });
    casinoStore.getState().record(5, 5);
    casinoStore.getState().close();
    expect(casinoStore.getState()).toMatchObject({ spent: 0, won: 0 });
  });
});
