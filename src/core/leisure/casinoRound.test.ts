import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type GameEvent, type GameState } from '../index';
import { serializeEnvelope } from '../../persistence/envelope';
import { blackjackOutcome, blackjackPayout, dealBlackjack, replayBlackjack } from './blackjack';
import { casinoRngState } from './casinoRound';
import { spinSlotMachine } from './slotMachine';

const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (extra: Partial<GameState> = {}, buildings: Building[] = [building(1, 'casino', 55, 50), building(2, 'coalPlant', 90, 40, { tier: 4 })]): GameState => ({
  ...newGame({ seed: 'casino-round', now: 0 }), buildings, nextId: 100, urbs: 1000, tutorial: null, adaptationUntil: 0, ...extra,
});
const spin = (state: GameState, stake = 10, buildingId = 1) => dispatch(state, { type: 'PlaySlotMachine', buildingId, stake }, 0);
const spunOf = (events: GameEvent[]) => events.find((event): event is Extract<GameEvent, { type: 'SlotSpun' }> => event.type === 'SlotSpun')!;

describe('slot machine command', () => {
  it('debits the Stake, pays the draw and moves the casino stream', () => {
    const start = city();
    const result = spin(start, 10);
    if (!result.ok) throw new Error(result.error.key);
    const event = spunOf(result.events);
    expect(result.state.urbs).toBe(start.urbs - 10 + event.payout);
    expect(event.stake).toBe(10);
    expect(result.state.casinoRng).toBe(spinSlotMachine(casinoRngState(start), 10).rngState);
    expect(result.state.rngState).toBe(start.rngState);
  });

  it('draws from the Seed: the same Seed gives the same spins and another one does not', () => {
    const outcomes = (state: GameState) => {
      let current = state;
      const reels: string[] = [];
      for (let round = 0; round < 6; round++) {
        const result = spin(current);
        if (!result.ok) throw new Error(result.error.key);
        reels.push(spunOf(result.events).reels.join(''));
        current = result.state;
      }
      return reels;
    };
    expect(outcomes(city())).toEqual(outcomes(city()));
    expect(outcomes(city({ seed: 'another-seed' }))).not.toEqual(outcomes(city()));
  });

  it('gives the next draw, never the same one, after a reload of a saved state following a round', () => {
    const first = spin(city());
    if (!first.ok) throw new Error(first.error.key);
    const reloaded = JSON.parse(JSON.stringify(first.state)) as GameState;
    const again = spin(reloaded);
    const direct = spin(first.state);
    if (!again.ok || !direct.ok) throw new Error('spin failed');
    expect(spunOf(again.events).reels).toEqual(spunOf(direct.events).reels);
    expect(again.state.casinoRng).not.toBe(first.state.casinoRng);
  });

  it('refuses a Stake above the Tier cap, off the steps or above the balance, and never goes negative', () => {
    expect(spin(city(), 500)).toMatchObject({ ok: false, error: { key: 'error.invalidStake' } });
    expect(spin(city(), 7)).toMatchObject({ ok: false, error: { key: 'error.invalidStake' } });
    expect(spin(city({ urbs: 5 }), 10)).toMatchObject({ ok: false, error: { key: 'error.notEnoughUrbs' } });
    expect(spin(city({ urbs: 10 }), 10)).toMatchObject({ ok: true });
  });

  it('refuses an unknown or non-casino building', () => {
    expect(spin(city(), 10, 99)).toMatchObject({ ok: false, error: { key: 'error.unknownBuilding' } });
    expect(spin(city(), 10, 2)).toMatchObject({ ok: false, error: { key: 'error.unknownBuilding' } });
  });

  it('refuses to play in a shut Casino', () => {
    const shut = city({}, [building(1, 'casino', 55, 50), building(2, 'coalPlant', 90, 40)]);
    const unpowered = { ...shut, buildings: [shut.buildings[0]!, building(3, 'home', 46, 50, { tier: 8 }), shut.buildings[1]!] };
    expect(spin(unpowered, 10)).toMatchObject({ ok: false, error: { key: 'error.casinoShut' } });
  });

  it('loses the Stake when nothing lines up', () => {
    let state = city({ urbs: 100_000 });
    let lost = 0;
    for (let round = 0; round < 40; round++) {
      const result = spin(state, 10);
      if (!result.ok) throw new Error(result.error.key);
      if (spunOf(result.events).payout === 0) lost += 1;
      state = result.state;
    }
    expect(lost).toBeGreaterThan(0);
    expect(state.urbs).toBeGreaterThanOrEqual(0);
  });
});

describe('casino rounds (blackJack)', () => {
  const tier2 = (extra: Partial<GameState> = {}) => city(extra, [building(1, 'casino', 55, 50, { tier: 2 }), building(2, 'coalPlant', 90, 40, { tier: 4 })]);
  const start = (state: GameState, stake = 10) => dispatch(state, { type: 'StartCasinoRound', buildingId: 1, game: 'blackjack', stake }, 0);
  const startedOf = (events: GameEvent[]) => events.find((event): event is Extract<GameEvent, { type: 'CasinoRoundStarted' }> => event.type === 'CasinoRoundStarted')!;

  it('needs the Tier of the Minigame', () => {
    expect(start(city())).toMatchObject({ ok: false, error: { key: 'error.tierTooLow' } });
    expect(start(tier2())).toMatchObject({ ok: true });
  });

  it('debits the Stake at the start and draws the round seed from the casino stream', () => {
    const base = tier2();
    const result = start(base, 50);
    if (!result.ok) throw new Error(result.error.key);
    expect(result.state.urbs).toBe(base.urbs - 50);
    expect(result.state.openRound).toMatchObject({ game: 'blackjack', stake: 50, buildingId: 1, roundSeed: startedOf(result.events).roundSeed });
    expect(result.state.casinoRng).not.toBe(casinoRngState(base));
    expect(start(base, 50)).toMatchObject({ state: { openRound: { roundSeed: startedOf(result.events).roundSeed } } });
  });

  it('settles by replaying the actions from the round seed', () => {
    let state = tier2();
    let seed = 0;
    for (let attempt = 0; attempt < 200; attempt++) {
      const result = start(state);
      if (!result.ok) throw new Error(result.error.key);
      seed = result.state.openRound!.roundSeed;
      if (!dealBlackjack(seed).finished) { state = result.state; break; }
      state = result.state;
    }
    const before = state.urbs;
    const settled = dispatch(state, { type: 'SettleBlackjack', buildingId: 1, actions: ['stand'] }, 0);
    if (!settled.ok) throw new Error(settled.error.key);
    const round = replayBlackjack(seed, ['stand'])!;
    expect(settled.state.urbs).toBe(before + blackjackPayout(blackjackOutcome(round), 10, false));
    expect(settled.state.openRound).toBeUndefined();
    expect(dispatch(settled.state, { type: 'SettleBlackjack', buildingId: 1, actions: ['stand'] }, 0)).toMatchObject({ ok: false, error: { key: 'error.noOpenRound' } });
  });

  it('refuses a made-up result and charges the second Stake of a double', () => {
    let state = tier2();
    for (let attempt = 0; attempt < 400; attempt++) {
      const result = start(state);
      if (!result.ok) throw new Error(result.error.key);
      state = result.state;
      if (!dealBlackjack(state.openRound!.roundSeed).finished) break;
    }
    expect(dispatch(state, { type: 'SettleBlackjack', buildingId: 1, actions: [] }, 0)).toMatchObject({ ok: false, error: { key: 'error.invalidRound' } });
    const doubled = dispatch(state, { type: 'SettleBlackjack', buildingId: 1, actions: ['double'] }, 0);
    if (!doubled.ok) throw new Error(doubled.error.key);
    const round = replayBlackjack(state.openRound!.roundSeed, ['double'])!;
    expect(doubled.state.urbs).toBe(state.urbs - 10 + blackjackPayout(blackjackOutcome(round), 10, true));
    expect(dispatch({ ...state, urbs: 5 }, { type: 'SettleBlackjack', buildingId: 1, actions: ['double'] }, 0)).toMatchObject({ ok: false, error: { key: 'error.notEnoughUrbs' } });
  });

  it('forgets an unfinished round on save and when abandoned', () => {
    const started = start(tier2());
    if (!started.ok) throw new Error(started.error.key);
    expect(JSON.parse(serializeEnvelope(started.state, 0)).state.openRound).toBeUndefined();
    const abandoned = dispatch(started.state, { type: 'AbandonCasinoRound' }, 0);
    expect(abandoned.ok && abandoned.state.openRound).toBeUndefined();
    expect(abandoned.ok && abandoned.state.urbs).toBe(started.state.urbs);
  });
});
