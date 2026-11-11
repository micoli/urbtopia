import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type Command, type GameState, type VenueFixture } from '../index';
import { minTierOf, producibleItems, type GoodId } from '../economy/items';
import { hireFeeOf } from '../venues/staff';
import { wallFacingOf } from './interiorCommands';
import packhouseBalance from '../../../assets/defs/balance/packhouseInterior.json' with { type: 'json' };

const city = (tier = 3, urbs = 100_000, citizens = true): GameState => ({
  ...newGame({ seed: 'restocker', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [{ ...createBuilding(1, 'packhouse', 55, 50, 0), tier }, ...(citizens ? [{ ...createBuilding(2, 'home', 40, 40, 0), tier: 3 }] : [])],
});
const send = (state: GameState, command: Command): GameState => {
  const result = dispatch(state, command, 0);
  if (!result.ok) throw new Error(result.error.key);
  return result.state;
};
const failure = (state: GameState, command: Command) => {
  const result = dispatch(state, command, 0);
  return result.ok ? null : result.error.key;
};
const packhouse = (state: GameState): Building => state.buildings.find(candidate => candidate.id === 1)!;
const packedGood = (size: 'Crate' | 'Box'): GoodId => producibleItems('packhouse').find(item => item.endsWith(size) && minTierOf(item) <= 1)! as GoodId;
const hire: Command = { type: 'HireInteriorRestocker', buildingId: 1 };
const release: Command = { type: 'ReleaseInteriorRestocker', buildingId: 1 };

describe('hiring a Restocker for a Packhouse interior', () => {
  it('has a post only from the second Tier, as many as the Tier allows', () => {
    expect(packhouseBalance.restockerPosts).toEqual([0, 1, 1, 2, 3]);
    expect(failure(city(1), hire)).toBe('error.tierTooLow');
    expect(packhouse(send(city(2), hire)).interior?.restockers).toBe(1);
    expect(failure(send(city(2), hire), hire)).toBe('error.noStaffPost');
    expect(packhouse(send(send(city(4), hire), hire)).interior?.restockers).toBe(2);
  });

  it('costs five days of wages, then releases without a refund', () => {
    const hired = send(city(), hire);
    expect(hired.urbs).toBe(100_000 - hireFeeOf('restocker'));
    expect(hireFeeOf('restocker')).toBe(28 * 5);
    expect(send(hired, release).urbs).toBe(hired.urbs);
    expect(packhouse(send(hired, release)).interior?.restockers).toBe(0);
  });

  it('is refused without the Urbs for the fee, and when nobody is left to release', () => {
    expect(failure(city(3, 10), hire)).toBe('error.notEnoughUrbs');
    expect(failure(city(), release)).toBe('error.noStaffToRelease');
  });
});

const crate = packedGood('Crate');
const box = packedGood('Box');
const withExits = (hired: number, citizens = true): GameState => {
  const state = city(4, 100_000, citizens);
  const fixtures: VenueFixture[] = [
    { id: 1, type: 'packhouseExitCrate', x: 2, y: 3, rotation: 2 },
    { id: 2, type: 'packhouseExitBox', x: 4, y: 3, rotation: 2 },
    { id: 3, type: 'packhouseConveyor', x: 2, y: 1, rotation: 0 },
  ];
  return { ...state, buildings: state.buildings.map(building => (building.id === 1 ? { ...building, interior: { fixtures, nextFixtureId: 4, restockers: hired } } : building)) };
};
const exit = (state: GameState, id: number): VenueFixture => packhouse(state).interior!.fixtures.find(fixture => fixture.id === id)!;
const choose = (fixtureId: number, good: GoodId | null): Command => ({ type: 'SetExitRestock', buildingId: 1, fixtureId, good });
const assign = (fixtureId: number): Command => ({ type: 'AssignInteriorRestocker', buildingId: 1, fixtureId });
const unassign = (fixtureId: number): Command => ({ type: 'UnassignInteriorRestocker', buildingId: 1, fixtureId });

describe('choosing the Restock of an Exit', () => {
  it('takes a packed Good of the size of the Exit, and clears with none', () => {
    const chosen = send(withExits(0), choose(1, crate));
    expect(exit(chosen, 1).restock).toBe(crate);
    expect(exit(send(chosen, choose(1, null)), 1).restock).toBeUndefined();
  });

  it('refuses a Good of another size, a Good the Packhouse does not pack, and a Fixture that is no Exit', () => {
    expect(failure(withExits(0), choose(1, box))).toBe('error.wrongPackSize');
    expect(failure(withExits(0), choose(1, 'planks' as GoodId))).toBe('error.cannotProduce');
    expect(failure(withExits(0), choose(3, crate))).toBe('error.notAnExit');
    expect(failure(withExits(0, false), choose(1, crate))).toBe('error.itemLocked');
    expect(failure(withExits(0), choose(99, crate))).toBe('error.unknownFixture');
  });
});

describe('assigning a Restocker to an Exit', () => {
  it('needs a Restock on the Exit and a hired Restocker who is free', () => {
    expect(failure(withExits(1), assign(1))).toBe('error.noRestock');
    const chosen = send(send(withExits(0), choose(1, crate)), choose(2, box));
    expect(failure(chosen, assign(1))).toBe('error.noFreeRestocker');
    const staffed = send(send(withExits(1), choose(1, crate)), choose(2, box));
    expect(exit(send(staffed, assign(1)), 1).restocker).toBe(true);
    expect(failure(send(staffed, assign(1)), assign(2))).toBe('error.noFreeRestocker');
  });

  it('frees the Restocker when unassigned, when the Restock is cleared and when he is let go', () => {
    const staffed = send(send(withExits(1), choose(1, crate)), assign(1));
    expect(exit(send(staffed, unassign(1)), 1).restocker).toBeUndefined();
    expect(exit(send(staffed, choose(1, null)), 1).restocker).toBeUndefined();
    const released = send(staffed, release);
    expect(packhouse(released).interior?.restockers).toBe(0);
    expect(exit(released, 1).restocker).toBeUndefined();
  });

  it('refuses to unassign an Exit that has none', () => {
    expect(failure(withExits(1), unassign(1))).toBe('error.noRestockerAssigned');
  });
});

describe('moving or selling an Exit with a Restocker', () => {
  const staffed = (): GameState => send(send(withExits(1), choose(1, crate)), assign(1));

  it('frees the Restocker when the Exit is moved, and keeps its Restock', () => {
    const moved = send(staffed(), { type: 'MoveInteriorFixture', buildingId: 1, fixtureId: 1, x: 2, y: 8, rotation: wallFacingOf('packhouseExitCrate', { x: 2, y: 8 }, 9) });
    expect(exit(moved, 1).restocker).toBeUndefined();
    expect(exit(moved, 1).restock).toBe(crate);
    expect(send(moved, assign(1))).toBeDefined();
  });

  it('frees the Restocker when the Exit is taken out', () => {
    const removed = send(staffed(), { type: 'RemoveInteriorFixture', buildingId: 1, fixtureId: 1 });
    expect(packhouse(removed).interior?.restockers).toBe(1);
    expect(packhouse(removed).interior?.fixtures.some(fixture => fixture.restocker)).toBe(false);
    const other = send(send(removed, choose(2, box)), assign(2));
    expect(exit(other, 2).restocker).toBe(true);
  });
});
