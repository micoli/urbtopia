import { describe, expect, it } from 'vitest';
import { cityBenefits, createBuilding, dispatch, energyStats, footprintOf, homeBenefits, isCasinoPowered, newGame, poweredCasinoIds, totalCitizens, type Building, type GameState } from '../index';
import { casinoPower, gamesOfTier, stakeStepsOf } from './casino';

const building = (id: number, type: Building['type'], x: number, y = 50, extra: Partial<Building> = {}): Building => ({ ...createBuilding(id, type, x, y, 0), ...extra });
const city = (buildings: Building[], extra: Partial<GameState> = {}): GameState => ({
  ...newGame({ seed: 'casino', now: 0 }), buildings, nextId: 100, urbs: 100_000, tutorial: null,
  roads: Array.from({ length: 30 }, (_, index) => ({ x: 45 + index, y: 49, kind: 'road' as const, tier: 3 })), adaptationUntil: 0, ...extra,
});
const townsfolk = () => building(1, 'home', 46, 50, { tier: 7 });

describe('Casino rules', () => {
  it('unlocks at 250 Citizens', () => {
    const small = city([building(1, 'home', 46, 50, { tier: 6 })]);
    expect(totalCitizens(small)).toBeLessThan(250);
    expect(dispatch(small, { type: 'PlaceBuilding', buildingType: 'casino', x: 55, y: 50 }, 0)).toMatchObject({ ok: false, error: { key: 'error.itemLocked' } });
    const big = city([townsfolk()]);
    expect(totalCitizens(big)).toBe(250);
    const placed = dispatch(big, { type: 'PlaceBuilding', buildingType: 'casino', x: 55, y: 50 }, 0);
    expect(placed.ok && placed.state.urbs).toBe(big.urbs - 2500);
  });

  it('grows wider with each Tier (2x2, 3x2, 6x2), anchored on its tile', () => {
    expect([1, 2, 3].map(tier => footprintOf('casino', 0, tier))).toEqual([{ width: 2, depth: 2 }, { width: 3, depth: 2 }, { width: 6, depth: 2 }]);
  });

  it('draws three times a theater at Tier 1 and 50% more per Tier', () => {
    expect([1, 2, 3].map(casinoPower)).toEqual([6, 9, 13.5]);
  });

  it('offers a Minigame and a larger Stake with each Tier', () => {
    expect([1, 2, 3].map(tier => gamesOfTier(tier))).toEqual([['slotMachine'], ['slotMachine', 'blackjack'], ['slotMachine', 'blackjack', 'blockmatch']]);
    expect([1, 2, 3].map(tier => stakeStepsOf(tier).at(-1))).toEqual([100, 500, 2000]);
  });

  it('upgrades for Urbs and needs the extra column to be free', () => {
    const state = city([townsfolk(), building(2, 'casino', 55, 50)]);
    const second = dispatch(state, { type: 'UpgradeBuilding', buildingId: 2 }, 0);
    expect(second.ok && [second.state.urbs, second.state.buildings[1]!.tier]).toEqual([state.urbs - 4000, 2]);
    const blocked = city([townsfolk(), building(2, 'casino', 55, 50), building(3, 'home', 57, 50)]);
    expect(dispatch(blocked, { type: 'UpgradeBuilding', buildingId: 2 }, 0)).toMatchObject({ ok: false, error: { key: 'error.casinoExpansionBlocked' } });
    const third = second.ok ? dispatch(second.state, { type: 'UpgradeBuilding', buildingId: 2 }, 0) : second;
    expect(third.ok && [second.ok && second.state.urbs - third.state.urbs, third.state.buildings[1]!.tier]).toEqual([8000, 3]);
    expect(third.ok && dispatch(third.state, { type: 'UpgradeBuilding', buildingId: 2 }, 0)).toMatchObject({ ok: false, error: { key: 'error.maxTier' } });
  });
});

describe('Casino energy', () => {
  const supplied = (state: GameState, id: number) => energyStats(state).supplied.get(id) ?? 0;

  it('is shed before Homes when power falls short', () => {
    const state = city([building(1, 'home', 46, 50, { tier: 5 }), building(2, 'casino', 55, 50), building(3, 'coalPlant', 60, 40)]);
    expect(supplied(state, 1)).toBe(10);
    expect(supplied(state, 2)).toBeCloseTo(2);
    expect(isCasinoPowered(state, state.buildings[1]!)).toBe(false);
    expect(poweredCasinoIds(state).size).toBe(0);
  });

  it('is shed before other economic buildings too', () => {
    const state = city([building(1, 'shop', 46, 50), building(2, 'casino', 55, 50), building(3, 'coalPlant', 60, 40)]);
    expect(supplied(state, 1)).toBe(0.5);
    expect(supplied(state, 2)).toBeCloseTo(6);
    const crowded = city([...state.buildings, building(4, 'factory', 50, 52, { tier: 4 }), building(5, 'workshop', 50, 54, { tier: 3 })]);
    expect(supplied(crowded, 2)).toBeCloseTo(0.5);
    expect(supplied(crowded, 4)).toBe(8);
    expect(supplied(crowded, 5)).toBe(3);
  });

  it('stays open during an Adaptation period', () => {
    const state = city([building(1, 'home', 46, 50, { tier: 5 }), building(2, 'casino', 55, 50), building(3, 'coalPlant', 60, 40)], { adaptationUntil: 1 });
    expect(isCasinoPowered(state, state.buildings[1]!)).toBe(true);
  });
});

describe('Casino Well-being', () => {
  const home = () => building(1, 'home', 50, 50, { tier: 5 });
  const plant = () => building(3, 'coalPlant', 90, 40, { tier: 4 });
  const wellbeingOf = (state: GameState) => homeBenefits(state, state.buildings.find(b => b.type === 'home')!).wellbeing;
  const without = () => wellbeingOf(city([home(), plant()]));

  it('raises the Well-being of Homes in reach only while powered', () => {
    const powered = city([home(), building(2, 'casino', 54, 50), plant()]);
    expect(isCasinoPowered(powered, powered.buildings[1]!)).toBe(true);
    expect(wellbeingOf(powered) - without()).toBeCloseTo(6, 5);
    const shut = city([home(), building(2, 'casino', 54, 50), building(3, 'coalPlant', 90, 40)]);
    expect(isCasinoPowered(shut, shut.buildings[1]!)).toBe(false);
    expect(wellbeingOf(shut)).toBe(wellbeingOf(city([home(), building(3, 'coalPlant', 90, 40)])));
  });

  it('ignores Homes out of reach and stacks several Casinos with diminishing returns', () => {
    const far = city([home(), building(2, 'casino', 80, 50), plant()]);
    expect(wellbeingOf(far)).toBe(without());
    const two = city([home(), building(2, 'casino', 54, 50), building(4, 'casino', 54, 53), plant()]);
    expect(wellbeingOf(two) - without()).toBeCloseTo(100 * (1 - 0.94 * 0.94), 5);
    expect(cityBenefits(two).wellbeing).toBeCloseTo(wellbeingOf(two), 5);
  });
});
