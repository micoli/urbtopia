import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { createBuilding, dispatch, newGame, seatsOfCove, type Command, type GameState } from '../index';
import { checkGameState } from '../../persistence/validate';

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

const row = (count: number, y = 50, fromX = 50) => Array.from({ length: count }, (_, index) => ({ x: fromX + index, y }));
const buyShip = (x: number, y = 50, coveId = 100): Command => ({ type: 'BuyBoat', family: 'pirate', marinaId: coveId, x, y });

function cove(tiles = 24, overrides: Partial<GameState> = {}): GameState {
  const base = newGame({ seed: 'pirates', now: T0 });
  return {
    ...base, urbs: 1_000_000, tutorial: null, adaptationUntil: 0, nextId: 200,
    ownedParcels: [...base.ownedParcels, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 3 }],
    roads: row(10, 46).map((tile) => ({ ...tile, kind: 'road' as const })),
    buildings: [
      ...Array.from({ length: 40 }, (_, index) => ({ ...createBuilding(index + 1, 'home', index * 3, 10, 0), tier: 6 })),
      createBuilding(100, 'pirateCove', 50, 47, 0),
    ],
    waterTiles: row(tiles),
    ...overrides,
  };
}

describe('Buying a Pirate ship', () => {
  it('places it on the water of its Pirate cove for 5,000 Urbs', () => {
    const state = succeed(cove(), buyShip(52));
    expect(state.urbs).toBe(1_000_000 - 5_000);
    expect(state.boats).toEqual([{ id: 200, family: 'pirate', marinaId: 100, x: 52, y: 50 }]);
  });

  it('is refused at a Marina, and other Boats are refused at a Pirate cove', () => {
    const withMarina = cove(24, { buildings: [...cove().buildings, createBuilding(101, 'marina', 54, 48, 0)] });
    expect(failureKey(withMarina, buyShip(55, 50, 101))).toBe('error.unknownBuilding');
    expect(failureKey(withMarina, { type: 'BuyBoat', family: 'pleasure', marinaId: 100, x: 55, y: 50 })).toBe('error.unknownBuilding');
  });

  it('allows one per 12 connected Water tiles', () => {
    const one = succeed(cove(23), buyShip(51));
    expect(failureKey(one, buyShip(52))).toBe('error.noWaterForPirateShip');
    const two = succeed(succeed(cove(24), buyShip(51)), buyShip(52));
    expect(failureKey(two, buyShip(53))).toBe('error.noWaterForPirateShip');
  });

  it('shares the limit between the Pirate coves on the same water', () => {
    const twoCoves = cove(24, { buildings: [...cove().buildings, createBuilding(101, 'pirateCove', 60, 47, 0)] });
    const two = succeed(succeed(twoCoves, buyShip(51)), buyShip(62, 50, 101));
    expect(failureKey(two, buyShip(53))).toBe('error.noWaterForPirateShip');
    expect(failureKey(two, buyShip(63, 50, 101))).toBe('error.noWaterForPirateShip');
  });

  it('does not count other Boats', () => {
    const withMarina = cove(12, { buildings: [...cove().buildings, createBuilding(101, 'marina', 54, 48, 0)] });
    const pleasure = succeed(withMarina, { type: 'BuyBoat', family: 'pleasure', marinaId: 101, x: 55, y: 50 });
    expect(failureKey(pleasure, buyShip(52))).toBeNull();
  });
});

describe('Removing what a Pirate ship needs', () => {
  it('refuses a Water tile that would leave the water under the limit', () => {
    const state = succeed(cove(12), buyShip(51));
    expect(failureKey(state, { type: 'RemoveWater', tiles: [{ x: 61, y: 50 }] })).toBe('error.waterInUse');
  });

  it('allows a Water tile above the limit', () => {
    const state = succeed(cove(13), buyShip(51));
    expect(failureKey(state, { type: 'RemoveWater', tiles: [{ x: 62, y: 50 }] })).toBeNull();
  });

  it('refuses selling or moving a Pirate cove that has a Pirate ship', () => {
    const state = succeed(cove(), buyShip(52));
    expect(failureKey(state, { type: 'SellBuilding', id: 100 })).toBe('error.pirateCoveInUse');
    expect(failureKey(state, { type: 'MoveBuilding', id: 100, x: 40, y: 47 })).toBe('error.pirateCoveInUse');
  });
});

describe('Stands', () => {
  const standsAt = (x: number, buildingType: 'standsSmall' | 'standsMedium' | 'standsLarge' = 'standsSmall', y = 51): Command => ({ type: 'PlaceBuilding', buildingType, x, y, rotation: 0 });

  it('belong to the Pirate cove whose water they touch', () => {
    const state = succeed(cove(), standsAt(52));
    expect(state.buildings.at(-1)).toMatchObject({ type: 'standsSmall', coveId: 100 });
  });

  it('are refused with no Pirate cove on that water', () => {
    expect(failureKey(cove(), standsAt(52, 'standsSmall', 60))).toBe('error.needsPirateCoveWater');
    const marinaOnly = cove(24, { buildings: [...cove().buildings.filter((building) => building.id !== 100), createBuilding(101, 'marina', 54, 48, 0)] });
    expect(failureKey(marinaOnly, standsAt(52))).toBe('error.needsPirateCoveWater');
  });

  it('belong to the nearest Pirate cove, the lowest id on a tie', () => {
    const twoCoves = cove(24, { buildings: [...cove().buildings, createBuilding(101, 'pirateCove', 60, 47, 0)] });
    expect(succeed(twoCoves, standsAt(61)).buildings.at(-1)!.coveId).toBe(101);
    expect(succeed(twoCoves, standsAt(51)).buildings.at(-1)!.coveId).toBe(100);
    expect(succeed(twoCoves, standsAt(56)).buildings.at(-1)!.coveId).toBe(100);
  });

  it('do not change Pirate cove when a nearer one is placed', () => {
    const state = succeed(cove(), standsAt(58));
    const withSecond = succeed({ ...state, roads: [...state.roads, ...row(5, 46, 56).map((tile) => ({ ...tile, kind: 'road' as const }))] }, { type: 'PlaceBuilding', buildingType: 'pirateCove', x: 56, y: 47, rotation: 0 });
    expect(withSecond.buildings.find((building) => building.type === 'standsSmall')!.coveId).toBe(100);
  });

  it('add their seats up to the cap of the Tier', () => {
    const large = (x: number): Command => standsAt(x, 'standsLarge');
    const state = succeed(cove(), large(50));
    expect(seatsOfCove(state, state.buildings.find((building) => building.id === 100)!)).toBe(400);
    const upgraded = succeed(state, { type: 'UpgradeBuilding', buildingId: 100 });
    expect(seatsOfCove(upgraded, upgraded.buildings.find((building) => building.id === 100)!)).toBe(500);
  });

  it('keep their Pirate cove from being sold or moved', () => {
    const state = succeed(cove(), standsAt(52));
    expect(failureKey(state, { type: 'SellBuilding', id: 100 })).toBe('error.pirateCoveInUse');
    expect(failureKey(state, { type: 'MoveBuilding', id: 100, x: 40, y: 47 })).toBe('error.pirateCoveInUse');
  });

  it('refuse removing the Water tile that links them to their Pirate cove', () => {
    const state = succeed(cove(24), standsAt(60));
    expect(failureKey(state, { type: 'RemoveWater', tiles: [{ x: 55, y: 50 }] })).toBe('error.waterInUse');
  });

  it('move only along the water of their Pirate cove', () => {
    const state = succeed(cove(), standsAt(52));
    const id = state.buildings.at(-1)!.id;
    expect(failureKey(state, { type: 'MoveBuilding', id, x: 60, y: 51, rotation: 0 })).toBeNull();
    expect(failureKey(state, { type: 'MoveBuilding', id, x: 60, y: 60, rotation: 0 })).toBe('error.needsPirateCoveWater');
  });

  it('make a save invalid without their Pirate cove', () => {
    const state = succeed(cove(), standsAt(52));
    expect(checkGameState(state).ok).toBe(true);
    const orphan = { ...state, buildings: state.buildings.map((building) => (building.type === 'standsSmall' ? { ...building, coveId: 999 } : building)) };
    expect(checkGameState(orphan).ok).toBe(false);
  });
});

describe('A Pirate ship', () => {
  it('can be sold at the usual refund', () => {
    const state = succeed(succeed(cove(), buyShip(52)), { type: 'SellBoat', id: 200 });
    expect(state.urbs).toBe(1_000_000 - 1_250);
    expect(state.boats).toEqual([]);
  });

  it('keeps the save valid', () => {
    expect(checkGameState(succeed(cove(), buyShip(52))).ok).toBe(true);
  });

  it('makes a save invalid when bound to a Marina', () => {
    const state = succeed(cove(), buyShip(52));
    const wrong = { ...state, buildings: state.buildings.map((building) => (building.id === 100 ? { ...building, type: 'marina' as const } : building)) };
    expect(checkGameState(wrong).ok).toBe(false);
  });
});
