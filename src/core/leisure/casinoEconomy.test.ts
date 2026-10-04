import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type GameEvent, type GameState } from '../index';
import { applyBlackjackAction, handValue, dealBlackjack, replayBlackjack, type BlackjackAction } from './blackjack';
import { SLOT_PAYOUTS } from './slotMachine';

const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (urbs: number, tier = 3, seed = 'casino-economy'): GameState => ({
  ...newGame({ seed, now: 0 }), nextId: 100, urbs, tutorial: null, adaptationUntil: 0,
  buildings: [building(1, 'casino', 55, 50, { tier }), building(2, 'coalPlant', 90, 40, { tier: 4 })],
});
const send = (state: GameState, command: Parameters<typeof dispatch>[1]) => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result;
};
const spun = (events: GameEvent[]) => events.find((event): event is Extract<GameEvent, { type: 'SlotSpun' }> => event.type === 'SlotSpun')!;
const dealerLike = (actionsSoFar: BlackjackAction[], seed: number): BlackjackAction[] => {
  let round = dealBlackjack(seed);
  const actions = [...actionsSoFar];
  while (!round.finished) {
    const action: BlackjackAction = handValue(round.player).total < 17 ? 'hit' : 'stand';
    round = applyBlackjackAction(round, action)!;
    actions.push(action);
  }
  return actions;
};

describe('Casino economy', () => {
  it('never creates Urbs from nothing and slowly drains a slot machine player', () => {
    let state = city(100_000);
    const start = state.urbs;
    for (let round = 0; round < 30_000; round++) {
      const result = send(state, { type: 'PlaySlotMachine', buildingId: 1, stake: 10 });
      const event = spun(result.events);
      expect(event.payout).toBeLessThanOrEqual(10 * SLOT_PAYOUTS.threeSevens);
      expect(result.state.urbs).toBe(state.urbs - 10 + event.payout);
      expect(result.state.urbs).toBeGreaterThanOrEqual(0);
      state = result.state;
    }
    expect(state.urbs).toBeLessThan(start);
  });

  it('cannot play with Urbs that are not there', () => {
    const broke = city(5);
    expect(dispatch(broke, { type: 'PlaySlotMachine', buildingId: 1, stake: 10 }, 0)).toMatchObject({ ok: false, error: { key: 'error.notEnoughUrbs' } });
    expect(dispatch(city(0), { type: 'StartCasinoRound', buildingId: 1, game: 'blockmatch', stake: 10 }, 0)).toMatchObject({ ok: false });
    const exact = send(city(10), { type: 'StartCasinoRound', buildingId: 1, game: 'blockmatch', stake: 10 });
    expect(exact.state.urbs).toBe(0);
    expect(send(exact.state, { type: 'SettleBlockmatch', buildingId: 1, stars: 0 }).state.urbs).toBe(0);
  });

  it('drains a blackJack player who copies the dealer', () => {
    let state = city(100_000);
    const start = state.urbs;
    for (let round = 0; round < 6000; round++) {
      const started = send(state, { type: 'StartCasinoRound', buildingId: 1, game: 'blackjack', stake: 10 });
      const actions = dealerLike([], started.state.openRound!.roundSeed);
      expect(replayBlackjack(started.state.openRound!.roundSeed, actions)).not.toBeNull();
      state = send(started.state, { type: 'SettleBlackjack', buildingId: 1, actions }).state;
      expect(state.urbs).toBeGreaterThanOrEqual(0);
    }
    expect(state.urbs).toBeLessThan(start);
  });

  it('does not pay twice for the same round', () => {
    const started = send(city(1000), { type: 'StartCasinoRound', buildingId: 1, game: 'blockmatch', stake: 100 });
    const settled = send(started.state, { type: 'SettleBlockmatch', buildingId: 1, stars: 3 });
    expect(settled.state.urbs).toBe(1100);
    expect(dispatch(settled.state, { type: 'SettleBlockmatch', buildingId: 1, stars: 3 }, 0)).toMatchObject({ ok: false, error: { key: 'error.noOpenRound' } });
  });

  it('refunds less than it cost when sold, so building and selling is no way to make Urbs', () => {
    const state = city(10_000);
    const sold = send(state, { type: 'SellBuilding', id: 1 });
    expect(sold.state.urbs - state.urbs).toBeLessThan(2500);
  });
});
