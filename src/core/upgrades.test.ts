import { describe, expect, it } from 'vitest';
import { dispatch, footprintTiles, newGame, totalCitizens, utilityDemand, type Command, type GameState } from './index';

const T0 = 1_700_000_000_000;

function succeed(state: GameState, command: Command): GameState {
  const result = dispatch(state, command, T0);
  if (!result.ok) throw new Error(`expected success, got ${result.error.key}`);
  return result.state;
}

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

const initial = newGame({ seed: 'amber-fox-4821', now: T0 });
const rich: GameState = {
  ...initial,
  urbs: 1_000_000,
  storage: { materials: {}, goods: { planks: 10, bricks: 10, tiles: 10, tools: 10, glass: 10, circuits: 10 } },
};

function cityWithUtilities(): GameState {
  let state = rich;
  for (let index = 0; index < 8; index++) {
    state = succeed(state, { type: 'PlaceBuilding', buildingType: 'powerPlant', x: 50 + index, y: 70 });
    state = succeed(state, { type: 'PlaceBuilding', buildingType: 'waterTower', x: 50 + index, y: 72 });
  }
  return state;
}

const withHome = succeed(cityWithUtilities(), { type: 'PlaceBuilding', buildingType: 'home', x: 56, y: 59 });
const HOME_ID = withHome.buildings.find((b) => b.type === 'home')?.id ?? 0;
const upgrade: Command = { type: 'UpgradeHome', buildingId: HOME_ID };
const homeOf = (state: GameState) => state.buildings.find((b) => b.id === HOME_ID);

describe('UpgradeHome', () => {
  it('goes up one Tier at a time, paying Urbs and Goods, with Citizens appearing at once', () => {
    const state = succeed(withHome, upgrade);
    expect(homeOf(state)?.tier).toBe(2);
    expect(totalCitizens(state)).toBe(15);
    expect(withHome.urbs - state.urbs).toBe(150);
    expect(state.storage.goods.planks).toBe(7);
  });

  it('follows the cost table from Tier 2 to Tier 6', () => {
    const costs: [number, Record<string, number>][] = [
      [150, { planks: 3 }],
      [400, { bricks: 4, planks: 2 }],
      [1000, { tiles: 4, bricks: 3 }],
      [2500, { tools: 4, tiles: 3 }],
      [6000, { glass: 4, circuits: 3 }],
    ];
    let state = withHome;
    for (const [urbs, goods] of costs) {
      const before = state;
      state = succeed(state, upgrade);
      expect(before.urbs - state.urbs).toBe(urbs);
      for (const [good, amount] of Object.entries(goods)) {
        expect((before.storage.goods as Record<string, number>)[good]! - (state.storage.goods as Record<string, number>)[good]!).toBe(amount);
      }
    }
    expect(homeOf(state)?.tier).toBe(6);
    expect(totalCitizens(state)).toBe(160);
    expect(utilityDemand(state)).toEqual({ power: 16, water: 16 });
  });

  it('stops at Tier 6', () => {
    let state = withHome;
    for (let tier = 2; tier <= 6; tier++) state = succeed(state, upgrade);
    expect(failureKey(state, upgrade)).toBe('error.maxTier');
  });

  it('is refused when Urbs or Goods are missing, taking nothing', () => {
    expect(failureKey({ ...withHome, urbs: 100 }, upgrade)).toBe('error.notEnoughUrbs');
    expect(failureKey({ ...withHome, storage: { materials: {}, goods: { planks: 2 } } }, upgrade)).toBe('error.missingGoods');
  });

  it('is refused when the new Demand would exceed Capacity', () => {
    const tight = succeed(initial, { type: 'PlaceBuilding', buildingType: 'powerPlant', x: 70, y: 70 });
    let state: GameState = { ...tight, urbs: 1_000_000, storage: rich.storage };
    state = succeed(state, { type: 'PlaceBuilding', buildingType: 'waterTower', x: 72, y: 70 });
    state = succeed(state, { type: 'PlaceBuilding', buildingType: 'home', x: 56, y: 59 });
    const homeId = state.buildings.find((b) => b.type === 'home')?.id ?? 0;
    for (let tier = 2; tier <= 5; tier++) state = succeed(state, { type: 'UpgradeHome', buildingId: homeId });
    expect(utilityDemand(state).power).toBe(10);
    expect(failureKey(state, { type: 'UpgradeHome', buildingId: homeId })).toBe('error.notEnoughPower');
  });

  it('refuses a building that is not a Home', () => {
    expect(failureKey(withHome, { type: 'UpgradeHome', buildingId: 1 })).toBe('error.notAHome');
  });

  it('grows the footprint of the Home and needs free room for it', () => {
    const upgraded = succeed(withHome, upgrade);
    expect(footprintTiles(homeOf(upgraded)!)).toHaveLength(2);
    const blocked = succeed(withHome, { type: 'PlaceBuilding', buildingType: 'powerPlant', x: 57, y: 59 });
    expect(failureKey(blocked, upgrade)).toBe('error.tilesOccupied');
  });

  it('is not refunded when the Home is sold', () => {
    const state = succeed(withHome, upgrade);
    expect(succeed(state, { type: 'SellBuilding', id: HOME_ID }).urbs - state.urbs).toBe(Math.floor(150 * 0.75));
  });
});
