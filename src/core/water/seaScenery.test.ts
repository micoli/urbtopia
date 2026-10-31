import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { checkGameState } from '../../persistence/validate';
import { connectedWaterKeys, createBuilding, dispatch, footprintOf, navigableWaterKeys, newGame, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;

const walkingEnabled = WALKING.enabled;
beforeAll(() => {
  WALKING.enabled = false;
});
afterAll(() => {
  WALKING.enabled = walkingEnabled;
});

function failureKey(state: GameState, command: Command): string | null {
  const result = dispatch(state, command, T0);
  return result.ok ? null : result.error.key;
}

function succeed(state: GameState, command: Command): GameState {
  const result = dispatch(state, command, T0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
}

// Water from (50,50) to (57,53), with a Pirate cove on its north shore.
const lake = Array.from({ length: 8 * 4 }, (_, index) => ({ x: 50 + (index % 8), y: 50 + Math.floor(index / 8) }));

function bay(overrides: Partial<GameState> = {}): GameState {
  const base = newGame({ seed: 'scenery', now: T0 });
  return {
    ...base, urbs: 1_000_000, tutorial: null, adaptationUntil: 0, nextId: 200,
    ownedParcels: [...base.ownedParcels, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 3 }],
    roads: Array.from({ length: 4 }, (_, index) => ({ x: 50 + index, y: 46, kind: 'road' as const })),
    buildings: [
      ...Array.from({ length: 40 }, (_, index) => ({ ...createBuilding(index + 1, 'home', index * 3, 10, 0), tier: 6 })),
      createBuilding(100, 'pirateCove', 50, 47, 0),
    ],
    waterTiles: lake,
    ...overrides,
  };
}

const island = (x: number, y: number): Command => ({ type: 'PlaceBuilding', buildingType: 'desertIsland', x, y, rotation: 0 });
const coveIn = (state: GameState) => state.buildings.find((building) => building.id === 100)!;

describe('Laying a Desert island or a Sea fort', () => {
  it('is free of roads and charges its price', () => {
    const state = succeed(bay(), island(53, 51));
    expect(state.urbs).toBe(1_000_000 - 150);
    expect(failureKey(bay(), { type: 'PlaceBuilding', buildingType: 'seaFort4x4', x: 52, y: 50, rotation: 0 })).toBeNull();
  });

  it('is refused off the water, even partly', () => {
    expect(failureKey(bay(), island(53, 60))).toBe('error.needsWaterTiles');
    expect(failureKey(bay(), island(57, 51))).toBe('error.needsWaterTiles');
  });

  it('is refused on a Boat, a Bridge or other scenery', () => {
    const withShip = succeed(bay(), { type: 'BuyBoat', family: 'pirate', marinaId: 100, x: 53, y: 51 });
    expect(failureKey(withShip, island(53, 51))).toBe('error.tilesOccupied');
    expect(failureKey(succeed(bay(), island(53, 51)), island(54, 52))).toBe('error.tilesOccupied');
    expect(failureKey(bay({ bridges: [{ x: 53, y: 51, length: 1, axis: 'x' }] }), island(53, 51))).toBe('error.tilesOccupied');
  });

  it('takes its tiles out of the navigable water', () => {
    const state = succeed(bay(), island(53, 51));
    expect(navigableWaterKeys(state).size).toBe(28);
    expect(connectedWaterKeys(state, coveIn(state)).size).toBe(28);
    expect(connectedWaterKeys(bay(), coveIn(bay())).size).toBe(32);
    expect(checkGameState(state).ok).toBe(true);
  });

  it('refuses a Boat on its tiles', () => {
    const state = succeed(bay(), island(53, 51));
    expect(failureKey(state, { type: 'BuyBoat', family: 'pirate', marinaId: 100, x: 53, y: 51 })).toBe('error.notOnMarinaWater');
  });

  it('is refused when it would leave the water under the Pirate ship limit', () => {
    const narrow = bay({ waterTiles: Array.from({ length: 12 }, (_, index) => ({ x: 50 + (index % 6), y: 50 + Math.floor(index / 6) })) });
    const withShip = succeed(narrow, { type: 'BuyBoat', family: 'pirate', marinaId: 100, x: 50, y: 50 });
    expect(failureKey(withShip, island(53, 50))).toBe('error.waterInUse');
  });

  it('is refused when it would cut Stands off their Pirate cove', () => {
    const corridor = bay({ waterTiles: Array.from({ length: 2 * 8 }, (_, index) => ({ x: 50 + Math.floor(index / 2), y: 50 + (index % 2) })) });
    const withStands = succeed(corridor, { type: 'PlaceBuilding', buildingType: 'standsSmall', x: 57, y: 52, rotation: 0 });
    expect(failureKey(withStands, island(54, 50))).toBe('error.waterInUse');
  });

  it('frees the water again once sold', () => {
    const state = succeed(bay(), island(53, 51));
    const id = state.buildings.at(-1)!.id;
    expect(navigableWaterKeys(succeed(state, { type: 'SellBuilding', id })).size).toBe(32);
  });

  it('refuses removing a Water tile beneath it', () => {
    const state = succeed(bay(), island(53, 51));
    expect(failureKey(state, { type: 'RemoveWater', tiles: [{ x: 53, y: 51 }] })).toBe('error.waterInUse');
  });

  it('makes a save invalid off the water', () => {
    const state = succeed(bay(), island(53, 51));
    expect(checkGameState({ ...state, waterTiles: [] }).ok).toBe(false);
  });

  it('refuses a Bridge on its tiles', () => {
    const state = succeed(bay({ roads: [...bay().roads, { x: 52, y: 51, kind: 'road' }, { x: 55, y: 51, kind: 'road' }] }), island(53, 51));
    expect(failureKey(state, { type: 'PlaceBridge', x: 53, y: 51, length: 2, axis: 'x' })).toBe('error.bridgeNeedsWater');
  });

  describe('Growing a Desert island', () => {
    const grow = (state: GameState, id: number): Command => ({ type: 'UpgradeBuilding', buildingId: id });
    const tilesOf = (state: GameState, id: number) => footprintOf('desertIsland', 0, state.buildings.find((building) => building.id === id)!.tier);

    it('goes from 2x2 to 2x3 then 3x3 for 400 then 900 Urbs', () => {
      const laid = succeed(bay(), island(53, 51));
      const id = laid.buildings.at(-1)!.id;
      const second = succeed(laid, grow(laid, id));
      expect(tilesOf(second, id)).toEqual({ width: 2, depth: 3 });
      expect(second.urbs).toBe(laid.urbs - 400);
      const third = succeed(second, grow(second, id));
      expect(tilesOf(third, id)).toEqual({ width: 3, depth: 3 });
      expect(third.urbs).toBe(second.urbs - 900);
      expect(navigableWaterKeys(third).size).toBe(23);
      expect(checkGameState(third).ok).toBe(true);
    });

    it('shifts when only the other side has free water', () => {
      const laid = succeed(bay(), island(53, 52));
      const id = laid.buildings.at(-1)!.id;
      const second = succeed(laid, grow(laid, id));
      expect(second.buildings.find((building) => building.id === id)).toMatchObject({ x: 53, y: 51, tier: 2 });
    });

    it('is refused off the water', () => {
      const shore = succeed(bay({ waterTiles: lake.filter((tile) => tile.y < 52) }), island(53, 50));
      expect(failureKey(shore, grow(shore, shore.buildings.at(-1)!.id))).toBe('error.needsWaterTiles');
    });

    it('is refused when it would leave the water under the Pirate ship limit', () => {
      const narrow = bay({ waterTiles: Array.from({ length: 16 }, (_, index) => ({ x: 50 + (index % 4), y: 50 + Math.floor(index / 4) })) });
      const withShip = succeed(succeed(narrow, { type: 'BuyBoat', family: 'pirate', marinaId: 100, x: 50, y: 50 }), island(52, 50));
      expect(failureKey(withShip, grow(withShip, withShip.buildings.at(-1)!.id))).toBe('error.waterInUse');
    });

    it('refuses to grow a Sea fort', () => {
      const laid = succeed(bay(), { type: 'PlaceBuilding', buildingType: 'seaFort3x3', x: 52, y: 50, rotation: 0 });
      expect(failureKey(laid, grow(laid, laid.buildings.at(-1)!.id))).toBe('error.maxTier');
    });
  });
});
