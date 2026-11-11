import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type Command, type FixtureId, type GameState, type Rotation, type VenueFixture } from '../index';
import { productionDurationOf } from '../economy/production';
import { floorBonusOfBuilding, floorLinksOf, floorUsageWeightsOf, packhouseBonusOf, packhouseExitLimitOf } from './factoryFloor';
import packhouseBalance from '../../../assets/defs/balance/packhouseFloor.json' with { type: 'json' };

let nextId = 1;
const put = (type: FixtureId, x: number, y: number, rotation: Rotation = 0, broken = false): VenueFixture => ({ id: nextId++, type, x, y, rotation, ...(broken ? { broken: true as const } : {}) });

// A Motor and a Shaft bring the Drive in to the right of a Machine at (x, y).
const driven = (x: number, y: number): VenueFixture[] => [put('packhouseShaft', x + 1, y, 1), put('packhouseMotor', x + 2, y, 1)];

// A Packer on the back wall whose Line goes down to an Exit of the given size.
const simpleLine = (size: 'Crate' | 'Box' | 'Pallet' = 'Crate', extra: VenueFixture[] = []): VenueFixture[] => [
  put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), ...extra, put(`packhouseExit${size}`, 2, 3, 2),
];
const withMiddle = (middle: VenueFixture[], size: 'Crate' | 'Box' | 'Pallet' = 'Crate'): VenueFixture[] => [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), ...middle, put(`packhouseExit${size}`, 2, 4, 2)];
const lined = (fixtures: VenueFixture[]): string[] => fixtures.filter(fixture => floorLinksOf(fixtures).lined.has(fixture.id)).map(fixture => fixture.type);

describe('the Line of a Packhouse floor', () => {
  it('carries Packets from a Packer whose Drive is linked to an Exit', () => {
    const fixtures = [...simpleLine(), put('packhouseConveyor', 2, 2)];
    expect(lined(fixtures).sort()).toEqual(['packhouseConveyor', 'packhouseConveyor', 'packhouseExitCrate', 'packhousePacker']);
  });

  it('starts nothing when the Packer has no Drive', () => {
    const fixtures = [put('packhousePacker', 2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyor', 2, 2), put('packhouseExitCrate', 2, 3, 2)];
    expect(floorLinksOf(fixtures).lined.size).toBe(0);
  });

  it('stops at a gap, at a Conveyor turned the wrong way and at a broken Fixture', () => {
    const gap = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseExitCrate', 2, 3, 2)];
    expect(floorLinksOf(gap).lined.size).toBe(0);
    const wrongWay = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyor', 2, 2, 2), put('packhouseExitCrate', 2, 3, 2)];
    expect(floorLinksOf(wrongWay).lined.size).toBe(0);
    const broken = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyor', 2, 2, 0, true), put('packhouseExitCrate', 2, 3, 2)];
    expect(floorLinksOf(broken).lined.size).toBe(0);
  });

  it('turns a corner with an elbow, to the left or to the right of the Packets', () => {
    const left = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyorElbowLeft', 2, 2), put('packhouseExitCrate', 3, 2, 1)];
    expect(floorLinksOf(left).lined.size).toBe(4);
    const right = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyorElbowRight', 2, 2), put('packhouseExitCrate', 1, 2, 3)];
    expect(floorLinksOf(right).lined.size).toBe(4);
    const wrongSide = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyorElbowRight', 2, 2), put('packhouseExitCrate', 3, 2, 1)];
    expect(floorLinksOf(wrongSide).lined.size).toBe(0);
  });

  it('merges two entries of a T into one exit, and a T fed from its back takes nothing', () => {
    const merged = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyorElbowLeft', 2, 2), put('packhouseConveyorTee', 3, 2, 0), put('packhouseExitCrate', 3, 3, 2)];
    expect(floorLinksOf(merged).lined.size).toBe(5);
    const fromBack = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyorTee', 2, 2), put('packhouseExitCrate', 2, 3, 2)];
    expect(floorLinksOf(fromBack).lined.size).toBe(0);
  });

  it('passes a Scanner, but not a Strapper that has no Drive', () => {
    const scanned = withMiddle([put('packhouseScanner', 2, 2), put('packhouseConveyor', 2, 3)]);
    expect(lined(scanned)).toContain('packhouseScanner');
    const undriven = withMiddle([put('packhouseStrapper', 2, 2), put('packhouseConveyor', 2, 3)]);
    expect(floorLinksOf(undriven).lined.size).toBe(0);
  });

  it('passes a Strapper once the Drive reaches it, and adds its speed and yield to the Packer', () => {
    const strapped = withMiddle([put('packhouseStrapper', 2, 2), ...driven(2, 2), put('packhouseConveyor', 2, 3)]);
    expect(lined(strapped)).toContain('packhouseStrapper');
    const plain = simpleLine('Crate', [put('packhouseConveyor', 2, 2)]);
    expect(packhouseBonusOf(strapped, 5, 'Crate').speed).toBeGreaterThan(packhouseBonusOf(plain, 5, 'Crate').speed);
  });

  it('adds a little yield for each Strapper beyond the first', () => {
    const one = withMiddle([put('packhouseStrapper', 2, 2), ...driven(2, 2), put('packhouseConveyor', 2, 3)]);
    const two = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseStrapper', 2, 2), ...driven(2, 2), put('packhouseStrapper', 2, 3), ...driven(2, 3), put('packhouseConveyor', 2, 4), put('packhouseExitCrate', 2, 5, 2)];
    const gain = packhouseBonusOf(two, 5, 'Crate').yield - packhouseBonusOf(one, 5, 'Crate').yield;
    expect(gain).toBeGreaterThan(0);
  });
});

describe('the bonus of a Packhouse floor', () => {
  it('counts only for the sizes of an Exit that is linked', () => {
    const fixtures = simpleLine('Crate', [put('packhouseConveyor', 2, 2)]);
    expect(packhouseBonusOf(fixtures, 5, 'Crate').speed).toBeGreaterThan(0);
    expect(packhouseBonusOf(fixtures, 5, 'Crate').yield).toBeGreaterThan(0);
    expect(packhouseBonusOf(fixtures, 5, 'Box')).toEqual({ speed: 0, yield: 0, power: 0 });
    expect(packhouseBonusOf(fixtures, 5, null)).toEqual({ speed: 0, yield: 0, power: 0 });
    expect(packhouseBonusOf(fixtures, 5).speed).toBe(packhouseBonusOf(fixtures, 5, 'Crate').speed);
  });

  it('is capped by the Tier and is nothing on an empty floor', () => {
    const fixtures = simpleLine('Crate', [put('packhouseConveyor', 2, 2)]);
    for (const tier of [1, 2, 3, 4, 5]) {
      expect(packhouseBonusOf(fixtures, tier, 'Crate').speed).toBeLessThanOrEqual(packhouseBalance.speedCaps[tier - 1]!);
      expect(packhouseBonusOf(fixtures, tier, 'Crate').yield).toBeLessThanOrEqual(packhouseBalance.yieldCaps[tier - 1]!);
    }
    expect(packhouseBonusOf([], 5, 'Crate')).toEqual({ speed: 0, yield: 0, power: 0 });
  });

  it('is told per Slot by the building: a Packhouse packs Crates faster than Boxes when only a Crate Exit is linked', () => {
    const building: Building = { ...createBuilding(1, 'packhouse', 50, 50, 0), tier: 3, floor: { fixtures: simpleLine('Crate', [put('packhouseConveyor', 2, 2)]), nextFixtureId: 100 } };
    const bare: Building = { ...building, floor: undefined };
    expect(floorBonusOfBuilding(building, 'wheatCrate').speed).toBeGreaterThan(0);
    expect(floorBonusOfBuilding(building, 'wheatBox').speed).toBe(0);
    expect(productionDurationOf(building, 'wheatCrate')).toBeLessThan(productionDurationOf(bare, 'wheatCrate'));
    expect(productionDurationOf(building, 'wheatBox')).toBe(productionDurationOf(bare, 'wheatBox'));
  });
});

describe('the wear of a Packhouse floor', () => {
  it('makes what lies downstream of a Scanner wear by a share of the rest', () => {
    const fixtures = withMiddle([put('packhouseScanner', 2, 2), put('packhouseConveyor', 2, 3)]);
    const weights = floorUsageWeightsOf(fixtures);
    const weightOf = (type: FixtureId) => weights.get(fixtures.find(fixture => fixture.type === type)!.id);
    expect(weightOf('packhousePacker')).toBe(1);
    expect(weightOf('packhouseExitCrate')).toBe(packhouseBalance.scannerWearFactor);
  });
});

const city = (tier = 5, urbs = 100_000): GameState => ({
  ...newGame({ seed: 'packhouse-floor', now: 0 }),
  nextId: 100,
  urbs,
  tutorial: null,
  buildings: [{ ...createBuilding(1, 'packhouse', 55, 50, 0), tier }],
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
const place = (fixture: FixtureId, x: number, y: number, rotation: Rotation = 0): Command => ({ type: 'PlaceFloorFixture', buildingId: 1, fixture, x, y, rotation });

describe('placing Fixtures on a Packhouse floor', () => {
  it('takes Fixtures of its own, and none of a Factory floor', () => {
    expect(send(city(), place('packhouseMotor', 2, 2)).buildings[0]!.floor?.fixtures).toHaveLength(1);
    expect(failure(city(), place('factoryMotor', 2, 2))).toBe('error.unknownCommand');
  });

  it('puts a Packer against the back wall only, turned toward the room', () => {
    expect(failure(city(), place('packhousePacker', 2, 0))).toBeNull();
    expect(failure(city(), place('packhousePacker', 2, 1))).toBe('error.tilesOccupied');
    expect(failure(city(), place('packhousePacker', 2, 0, 2))).toBe('error.tilesOccupied');
  });

  it('puts an Exit against the back wall or the left wall, with its back to it', () => {
    expect(failure(city(), place('packhouseExitCrate', 4, 0, 0))).toBeNull();
    expect(failure(city(), place('packhouseExitCrate', 0, 4, 3))).toBeNull();
    expect(failure(city(), place('packhouseExitCrate', 0, 4, 0))).toBe('error.tilesOccupied');
    expect(failure(city(), place('packhouseExitCrate', 3, 3, 0))).toBe('error.tilesOccupied');
  });

  it('limits the Exits by the Tier', () => {
    const first = send(city(1), place('packhouseExitCrate', 4, 0));
    expect(failure(first, place('packhouseExitBox', 5, 0))).toBe('error.exitLimitReached');
    expect(packhouseExitLimitOf(1)).toBe(1);
    expect(failure(send(city(3), place('packhouseExitCrate', 4, 0)), place('packhouseExitBox', 5, 0))).toBeNull();
  });

  it('keeps the Fixtures that need a higher Tier out of reach', () => {
    expect(failure(city(1), place('packhouseStrapper', 2, 2))).toBe('error.tierTooLow');
    expect(failure(city(2), place('packhouseStrapper', 2, 2))).toBeNull();
    expect(failure(city(2), place('packhouseScanner', 2, 2))).toBe('error.tierTooLow');
  });

  it('hires a Technician like a Factory floor does', () => {
    expect(failure(city(3), { type: 'HireFloorTechnician', buildingId: 1 })).toBeNull();
    expect(failure(city(1), { type: 'HireFloorTechnician', buildingId: 1 })).toBe('error.tierTooLow');
  });
});
