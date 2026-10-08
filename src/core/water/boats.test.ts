import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { WALKING } from '../traffic/walking';
import { advance, boatOperatingCost, createBuilding, dispatch, homeBenefits, newGame, readyFish, type Command, type GameState } from '../index';

const T0 = 1_700_000_000_000;
const HOUR = 3_600_000;

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
const buy = (x: number, y = 50, marinaId = 100): Command => ({ type: 'BuyBoat', family: 'pleasure', marinaId, x, y });

function harbour(overrides: Partial<GameState> = {}): GameState {
  const base = newGame({ seed: 'boats', now: T0 });
  return {
    ...base, urbs: 100_000, tutorial: null, adaptationUntil: 0, nextId: 200,
    roads: row(10, 47).map((tile) => ({ ...tile, kind: 'road' as const })),
    buildings: [
      { ...createBuilding(1, 'home', 40, 40, 0), tier: 6 },
      { ...createBuilding(100, 'marina', 50, 48, 0) },
    ],
    waterTiles: row(6, 50),
    ...overrides,
  };
}

describe('Buying a Pleasure boat', () => {
  it('costs 400 Urbs and places the Boat on a Water tile connected to the Marina', () => {
    const state = succeed(harbour(), buy(52));
    expect(state.urbs).toBe(100_000 - 400);
    expect(state.boats).toEqual([{ id: 200, family: 'pleasure', marinaId: 100, x: 52, y: 50 }]);
  });

  it('unlocks at 80 Citizens', () => {
    const small = harbour({ buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 4 }, createBuilding(100, 'marina', 50, 48, 0)] });
    expect(failureKey(small, buy(52))).toBe('error.itemLocked');
  });

  it('refuses land, disconnected water and occupied tiles', () => {
    const state = harbour({ waterTiles: [...row(3, 50), { x: 58, y: 50 }] });
    expect(failureKey(state, buy(55))).toBe('error.notOnMarinaWater');
    expect(failureKey(state, buy(58))).toBe('error.notOnMarinaWater');
    expect(failureKey(succeed(state, buy(51)), buy(51))).toBe('error.tilesOccupied');
  });

  it('is limited by the capacity of the Marina Tier', () => {
    let state = harbour();
    for (const x of [50, 51, 52]) state = succeed(state, buy(x));
    expect(failureKey(state, buy(53))).toBe('error.marinaFull');
    const upgraded = { ...state, buildings: state.buildings.map((b) => (b.type === 'marina' ? { ...b, tier: 2 } : b)) };
    expect(failureKey(upgraded, buy(53))).toBeNull();
  });

  it('needs enough Urbs and an existing Marina', () => {
    expect(failureKey(harbour({ urbs: 399 }), buy(52))).toBe('error.notEnoughUrbs');
    expect(failureKey(harbour(), buy(52, 50, 1))).toBe('error.unknownBuilding');
  });

  it('refunds part of the price when sold', () => {
    const bought = succeed(harbour(), buy(52));
    const sold = succeed(bought, { type: 'SellBoat', id: 200 });
    expect(sold.boats).toEqual([]);
    expect(sold.urbs).toBe(bought.urbs + 300);
    expect(failureKey(sold, { type: 'SellBoat', id: 200 })).toBe('error.unknownBoat');
  });
});

describe('Pleasure boat Well-being', () => {
  const home = (state: GameState) => state.buildings.find((b) => b.type === 'home')!;
  const nearHome = { buildings: [{ ...createBuilding(1, 'home', 52, 52, 0), tier: 6 }, createBuilding(100, 'marina', 50, 48, 0)] };

  it('raises the Well-being of Homes within reach', () => {
    const without = harbour(nearHome);
    const withBoat = succeed(without, buy(52));
    expect(homeBenefits(withBoat, home(withBoat)).wellbeing).toBeGreaterThan(homeBenefits(without, home(without)).wellbeing);
  });

  it('has no effect on far Homes', () => {
    const without = harbour();
    const withBoat = succeed(without, buy(52));
    expect(homeBenefits(withBoat, home(withBoat)).wellbeing).toBe(homeBenefits(without, home(without)).wellbeing);
  });

  it('stops when the running cost cannot be paid', () => {
    const without = harbour({ ...nearHome, urbs: 0 });
    const withBoat = { ...without, boats: [{ id: 200, family: 'pleasure' as const, marinaId: 100, x: 52, y: 50 }] };
    expect(homeBenefits(withBoat, home(withBoat)).wellbeing).toBe(homeBenefits(without, home(without)).wellbeing);
  });
});

describe('Pleasure boat running cost', () => {
  it('takes 2 Urbs per hour from the city', () => {
    const idle = harbour();
    const boated = succeed(idle, buy(52));
    const days = 3 * HOUR;
    const spent = advance(idle, T0 + days).state.urbs - advance(boated, T0 + days).state.urbs;
    expect(spent - 400).toBeCloseTo(6);
  });

  it('never drives the balance below zero', () => {
    const state = succeed(harbour({ urbs: 400 }), buy(52));
    expect(advance(state, T0 + 10 * HOUR).state.urbs).toBeGreaterThanOrEqual(0);
  });
});

describe('Protecting the Marina and the water', () => {
  it('refuses to sell or move a Marina that holds Boats', () => {
    const state = succeed(harbour(), buy(52));
    expect(failureKey(state, { type: 'SellBuilding', id: 100 })).toBe('error.marinaInUse');
    expect(failureKey(state, { type: 'MoveBuilding', id: 100, x: 53, y: 48 })).toBe('error.marinaInUse');
    expect(failureKey(succeed(state, { type: 'SellBoat', id: 200 }), { type: 'SellBuilding', id: 100 })).toBeNull();
  });

  it('refuses to remove the Water tile under a Boat', () => {
    const state = succeed(harbour(), buy(52));
    expect(failureKey(state, { type: 'RemoveWater', tiles: [{ x: 52, y: 50 }] })).toBe('error.waterInUse');
  });

  it('refuses to remove a Water tile that would cut a Boat off its Marina', () => {
    const state = succeed(harbour({ waterTiles: [...row(4, 50), { x: 53, y: 51 }, { x: 54, y: 51 }] }), buy(54, 51));
    expect(failureKey(state, { type: 'RemoveWater', tiles: [{ x: 53, y: 51 }] })).toBe('error.waterInUse');
  });

  it('removes the free Water tiles of a drag and keeps the others', () => {
    const state = succeed(harbour(), buy(52));
    const after = succeed(state, { type: 'RemoveWater', tiles: row(6) });
    expect(after.waterTiles).toEqual([{ x: 51, y: 50 }, { x: 52, y: 50 }]);
  });
});

describe('Fishing boat', () => {
  const MINUTE = 60_000;
  const fishing = (x = 52): Command => ({ type: 'BuyBoat', family: 'fishing', marinaId: 100, x, y: 50 });
  const withStorehouse = (state: GameState): GameState => ({ ...state, buildings: [...state.buildings, createBuilding(2, 'storehouse', 56, 44, 0)] });
  const later = (state: GameState, minutes: number): GameState => ({ ...state, lastSeen: state.lastSeen + minutes * MINUTE });

  it('costs 800 Urbs, unlocks at 100 Citizens and has no running cost', () => {
    const small = harbour({ buildings: [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 4 }, createBuilding(100, 'marina', 50, 48, 0)] });
    expect(failureKey(small, fishing())).toBe('error.itemLocked');
    const state = succeed(withStorehouse(harbour()), fishing());
    expect(state.urbs).toBe(100_000 - 800);
    expect(advance(state, T0 + 3 * HOUR).state.urbs).toBeGreaterThanOrEqual(state.urbs);
  });

  it('catches 1 Fish every 6 minutes, up to the Slots of the Marina Tier', () => {
    const state = succeed(withStorehouse(harbour()), fishing());
    expect(readyFish(later(state, 5), 100)).toBe(0);
    expect(readyFish(later(state, 6), 100)).toBe(1);
    expect(readyFish(later(state, 13), 100)).toBe(2);
    expect(readyFish(later(state, 600), 100)).toBe(2);
    const upgraded = { ...state, buildings: state.buildings.map((b) => (b.type === 'marina' ? { ...b, tier: 3 } : b)) };
    expect(readyFish(later(upgraded, 600), 100)).toBe(5);
  });

  it('collects the catch into the Materials compartment and keeps the progress of the current cycle', () => {
    const state = later(succeed(withStorehouse(harbour()), fishing()), 8);
    const collected = succeed(state, { type: 'CollectCatch', marinaId: 100 });
    expect(collected.storage.materials.fish).toBe(1);
    expect(readyFish(collected, 100)).toBe(0);
    expect(readyFish(later(collected, 4), 100)).toBe(1);
  });

  it('restarts the clock when the boat was full', () => {
    const state = later(succeed(withStorehouse(harbour()), fishing()), 600);
    const collected = succeed(state, { type: 'CollectCatch', marinaId: 100 });
    expect(collected.storage.materials.fish).toBe(2);
    expect(readyFish(later(collected, 5), 100)).toBe(0);
  });

  it('fails without a catch or without room', () => {
    const state = succeed(withStorehouse(harbour()), fishing());
    expect(failureKey(state, { type: 'CollectCatch', marinaId: 100 })).toBe('error.nothingToCollect');
    const noStorage = later(succeed(harbour(), fishing()), 8);
    expect(failureKey(noStorage, { type: 'CollectCatch', marinaId: 100 })).toBe('error.storageFull');
  });

  it('does not count the time that is forfeited offline or skipped', () => {
    const state = succeed(withStorehouse(harbour()), fishing());
    const skipped = succeed(state, { type: 'SkipTime', hours: 1 });
    expect(readyFish(skipped, 100)).toBe(2);
    const away = advance(state, T0 + 100 * HOUR).state;
    expect(readyFish(away, 100)).toBe(2);
  });

  it('turns two Fish into Canned fish in a Factory', () => {
    const state = { ...withStorehouse(harbour()), buildings: [...harbour().buildings, createBuilding(2, 'storehouse', 56, 44, 0), createBuilding(3, 'factory', 58, 44, 0)], storage: { materials: { fish: 4 }, goods: {} } };
    const queued = succeed(state, { type: 'QueueProduction', buildingId: 3, item: 'cannedFish' });
    expect(queued.storage.materials.fish).toBe(2);
  });
});

describe('Casino boat', () => {
  const casinoBoat = (x = 52): Command => ({ type: 'BuyBoat', family: 'casino', marinaId: 100, x, y: 50 });
  const BIG_CITY = [{ ...createBuilding(1, 'home', 40, 40, 0), tier: 8 }, createBuilding(100, 'marina', 50, 48, 0)];
  const docked = () => succeed(harbour({ buildings: BIG_CITY }), casinoBoat());

  it('costs 3000 Urbs and unlocks at 300 Citizens', () => {
    expect(failureKey(harbour(), casinoBoat())).toBe('error.itemLocked');
    const state = docked();
    expect(state.urbs).toBe(100_000 - 3000);
    expect(state.boats).toEqual([{ id: 200, family: 'casino', marinaId: 100, x: 52, y: 50, tier: 1 }]);
  });

  it('offers the slot machine with the Tier 1 Stake cap', () => {
    const state = docked();
    const spun = succeed(state, { type: 'PlaySlotMachine', buildingId: 200, stake: 10 });
    expect(spun.casinoRng).not.toBe(state.casinoRng);
    expect(failureKey(state, { type: 'PlaySlotMachine', buildingId: 200, stake: 500 })).toBe('error.invalidStake');
    expect(failureKey(state, { type: 'StartCasinoRound', buildingId: 200, game: 'blackjack', stake: 10 })).toBe('error.tierTooLow');
  });

  it('upgrades like a Casino and unlocks the next Minigames', () => {
    const state = docked();
    const second = succeed(state, { type: 'UpgradeBoat', id: 200 });
    expect(second.urbs).toBe(state.urbs - 4000);
    expect(failureKey(second, { type: 'StartCasinoRound', buildingId: 200, game: 'blackjack', stake: 50 })).toBeNull();
    const third = succeed(second, { type: 'UpgradeBoat', id: 200 });
    expect(failureKey(third, { type: 'UpgradeBoat', id: 200 })).toBe('error.maxTier');
  });

  it('needs no power and is never shed', () => {
    const state = docked();
    const noPower = { ...state, buildings: state.buildings.filter((building) => building.type !== 'powerPlant') };
    expect(failureKey(noPower, { type: 'PlaySlotMachine', buildingId: 200, stake: 10 })).toBeNull();
  });

  it('pays the energy bill of a Casino as a running cost, and shuts when it cannot be paid', () => {
    const state = docked();
    const idle = harbour({ buildings: BIG_CITY });
    expect(idle.urbs - advance(idle, T0 + HOUR).state.urbs - (state.urbs - advance(state, T0 + HOUR).state.urbs)).toBeCloseTo(-3);
    const broke = { ...state, urbs: 0 };
    expect(failureKey(broke, { type: 'PlaySlotMachine', buildingId: 200, stake: 10 })).toBe('error.casinoShut');
  });

  it('raises the Well-being of nearby Homes like a Casino', () => {
    const near = harbour({ buildings: [{ ...createBuilding(1, 'home', 52, 52, 0), tier: 8 }, createBuilding(100, 'marina', 50, 48, 0)] });
    const withBoat = succeed(near, casinoBoat());
    const home = (state: GameState) => state.buildings.find((b) => b.type === 'home')!;
    expect(homeBenefits(withBoat, home(withBoat)).wellbeing).toBeGreaterThan(homeBenefits(near, home(near)).wellbeing);
  });

  it('only upgrades Casino boats', () => {
    expect(failureKey(succeed(harbour(), buy(52)), { type: 'UpgradeBoat', id: 200 })).toBe('error.cannotProduce');
  });
});

describe('Boat running costs', () => {
  it('make a Casino boat cost what powering a Casino of the same Tier would through Backup power', () => {
    const casino = (tier: number) => boatOperatingCost({ id: 1, family: 'casino', marinaId: 1, x: 0, y: 0, tier });
    expect([1, 2, 3].map(casino)).toEqual([3, 4.5, 6.75]);
  });

  it('are 2 Urbs per hour for a Pleasure boat and nothing for a Fishing boat', () => {
    expect(boatOperatingCost({ id: 1, family: 'pleasure', marinaId: 1, x: 0, y: 0 })).toBe(2);
    expect(boatOperatingCost({ id: 1, family: 'fishing', marinaId: 1, x: 0, y: 0 })).toBe(0);
  });
});
