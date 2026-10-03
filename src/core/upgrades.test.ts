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
  storage: { materials: {}, goods: { planks: 10, bricks: 10, tiles: 10, tools: 10, glass: 10, circuits: 10, steel: 10, cement: 10, crystal: 10, jewelry: 10 } },
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
const upgrade: Command = { type: 'UpgradeBuilding', buildingId: HOME_ID };
const homeOf = (state: GameState) => state.buildings.find((b) => b.id === HOME_ID);

describe('UpgradeBuilding on a Home', () => {
  it('goes up one Tier at a time, paying Urbs and Goods, with Citizens appearing at once', () => {
    const state = succeed(withHome, upgrade);
    expect(homeOf(state)?.tier).toBe(2);
    expect(totalCitizens(state)).toBe(15);
    expect(withHome.urbs - state.urbs).toBe(150);
    expect(state.storage.goods.planks).toBe(7);
  });

  it('follows the cost table from Tier 2 to Tier 8', () => {
    const costs: [number, Record<string, number>][] = [
      [150, { planks: 3 }],
      [400, { bricks: 4, planks: 2 }],
      [1000, { tiles: 4, bricks: 3 }],
      [2500, { tools: 4, tiles: 3 }],
      [6000, { glass: 4, circuits: 3 }],
      [15000, { steel: 4, cement: 4 }],
      [40000, { crystal: 3, jewelry: 3 }],
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
    expect(homeOf(state)?.tier).toBe(8);
    expect(totalCitizens(state)).toBe(400);
    expect(utilityDemand(state)).toEqual({ power: 43, water: 40 });
  });

  it('houses 250 Citizens at Tier 7 and keeps the 2x2 footprint of Tiers 5 to 8', () => {
    let state = withHome;
    for (let tier = 2; tier <= 7; tier++) state = succeed(state, upgrade);
    expect(totalCitizens(state)).toBe(250);
    expect(utilityDemand(state)).toEqual({ power: 28, water: 25 });
    expect(footprintTiles(homeOf(state)!)).toHaveLength(4);
  });

  it('stops at Tier 8', () => {
    let state = withHome;
    for (let tier = 2; tier <= 8; tier++) state = succeed(state, upgrade);
    expect(failureKey(state, upgrade)).toBe('error.maxTier');
  });

  it('is refused when Urbs or Goods are missing, taking nothing', () => {
    expect(failureKey({ ...withHome, urbs: 100 }, upgrade)).toBe('error.notEnoughUrbs');
    expect(failureKey({ ...withHome, storage: { materials: {}, goods: { planks: 2 } } }, upgrade)).toBe('error.missingGoods');
  });

  it('retains the water capacity limit when electricity Demand can exceed generation', () => {
    const tight = succeed(initial, { type: 'PlaceBuilding', buildingType: 'powerPlant', x: 70, y: 70 });
    let state: GameState = { ...tight, urbs: 1_000_000, storage: rich.storage };
    state = succeed(state, { type: 'PlaceBuilding', buildingType: 'waterTower', x: 72, y: 70 });
    state = succeed(state, { type: 'PlaceBuilding', buildingType: 'home', x: 56, y: 59 });
    const homeId = state.buildings.find((b) => b.type === 'home')?.id ?? 0;
    for (let tier = 2; tier <= 5; tier++) state = succeed(state, { type: 'UpgradeBuilding', buildingId: homeId });
    expect(utilityDemand(state).power).toBe(13);
    expect(failureKey(state, { type: 'UpgradeBuilding', buildingId: homeId })).toBe('error.notEnoughWater');
  });

  it('refuses a building that has no Tier to reach', () => {
    const withShop: GameState = { ...withHome, buildings: withHome.buildings.map((b) => (b.id === 1 ? { ...b, type: 'shop' as const } : b)) };
    expect(failureKey(withShop, { type: 'UpgradeBuilding', buildingId: 1 })).toBe('error.maxTier');
  });

  it('grows the footprint of the Home and needs free room for it', () => {
    const upgraded = succeed(withHome, upgrade);
    expect(footprintTiles(homeOf(upgraded)!)).toHaveLength(2);
    const blocked = succeed(withHome, { type: 'PlaceBuilding', buildingType: 'powerPlant', x: 57, y: 59 });
    expect(failureKey(blocked, upgrade)).toBe('error.homeExpansionBlocked');
  });

  it('explains when a road blocks expansion without charging for the upgrade', () => {
    const blocked: GameState = { ...withHome, roads: [...withHome.roads, { x: 57, y: 59, kind: 'road' }] };
    const result = dispatch(blocked, upgrade, T0);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.key).toBe('error.homeExpansionBlocked');
    expect(blocked.urbs).toBe(withHome.urbs);
    expect(blocked.storage.goods).toEqual(withHome.storage.goods);
    expect(homeOf(blocked)?.tier).toBe(1);
  });

  it('is not refunded when the Home is sold', () => {
    const state = succeed(withHome, upgrade);
    expect(succeed(state, { type: 'SellBuilding', id: HOME_ID }).urbs - state.urbs).toBe(Math.floor(150 * 0.75));
  });
});
