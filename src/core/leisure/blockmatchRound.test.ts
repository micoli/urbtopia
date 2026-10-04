import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type GameEvent, type GameState } from '../index';
import { blockmatchLevelNumber, blockmatchPayout, blockmatchSeed } from './blockmatchRound';
import { generateLevel } from './blockmatch/levelGenerator';

const building = (id: number, type: Building['type'], x: number, y: number, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (tier = 3): GameState => ({
  ...newGame({ seed: 'blockMatch-round', now: 0 }), nextId: 100, urbs: 1000, tutorial: null, adaptationUntil: 0,
  buildings: [building(1, 'casino', 55, 50, { tier }), building(2, 'coalPlant', 90, 40, { tier: 4 })],
});
const started = (state: GameState, stake = 100) => dispatch(state, { type: 'StartCasinoRound', buildingId: 1, game: 'blockmatch', stake }, 0);
const settledOf = (events: GameEvent[]) => events.find((event): event is Extract<GameEvent, { type: 'BlockmatchSettled' }> => event.type === 'BlockmatchSettled')!;

describe('blockMatch payout', () => {
  it('loses the Stake without a star and adds 25%, 50% or 100% on top of it for 1, 2 or 3 stars', () => {
    expect([0, 1, 2, 3].map(stars => blockmatchPayout(stars, 100))).toEqual([0, 125, 150, 200]);
    expect(blockmatchPayout(3, 10)).toBe(20);
    expect(blockmatchPayout(1, 10)).toBe(12);
  });

  it('gets harder with the Casino Tier', () => {
    expect([1, 2, 3].map(blockmatchLevelNumber)).toEqual([4, 8, 14]);
  });

  it('builds the same level from the same round seed', () => {
    const level = (seed: number) => generateLevel(blockmatchSeed(seed), blockmatchLevelNumber(3));
    expect(level(5)).toEqual(level(5));
    expect(level(5)).not.toEqual(level(6));
  });
});

describe('blockMatch rounds', () => {
  it('needs a Tier 3 Casino', () => {
    expect(started(city(2))).toMatchObject({ ok: false, error: { key: 'error.tierTooLow' } });
    expect(started(city(3))).toMatchObject({ ok: true });
  });

  it.each([[0, 900], [1, 1025], [2, 1050], [3, 1100]])('settles %i stars to a balance of %i', (stars, balance) => {
    const open = started(city());
    if (!open.ok) throw new Error(open.error.key);
    expect(open.state.urbs).toBe(900);
    const settled = dispatch(open.state, { type: 'SettleBlockmatch', buildingId: 1, stars }, 0);
    if (!settled.ok) throw new Error(settled.error.key);
    expect(settled.state.urbs).toBe(balance);
    expect(settled.state.openRound).toBeUndefined();
    expect(settledOf(settled.events)).toMatchObject({ stake: 100, stars, payout: balance - 900 });
  });

  it('refuses a result without an open round, for another game or with impossible stars', () => {
    expect(dispatch(city(), { type: 'SettleBlockmatch', buildingId: 1, stars: 3 }, 0)).toMatchObject({ ok: false, error: { key: 'error.noOpenRound' } });
    const open = started(city());
    if (!open.ok) throw new Error(open.error.key);
    expect(dispatch(open.state, { type: 'SettleBlockmatch', buildingId: 1, stars: 4 }, 0)).toMatchObject({ ok: false, error: { key: 'error.invalidRound' } });
    expect(dispatch(open.state, { type: 'SettleBlackjack', buildingId: 1, actions: ['stand'] }, 0)).toMatchObject({ ok: false, error: { key: 'error.noOpenRound' } });
  });
});
