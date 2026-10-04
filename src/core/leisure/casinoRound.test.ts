import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type GameEvent, type GameState } from '../index';
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
