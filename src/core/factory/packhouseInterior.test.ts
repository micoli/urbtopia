import { describe, expect, it } from 'vitest';
import { createBuilding, dispatch, newGame, type Building, type Command, type FixtureId, type GameState, type Rotation, type VenueFixture } from '../index';
import { productionDurationOf } from '../economy/production';
import { floorBonusOfBuilding, floorLinksOf, floorMotionOf, floorPowerOfBuilding, floorUsageWeightsOf, lineFaultOf, linePathsOf, linkedExitsOf, packhouseBonusOf, packhouseExitLimitOf, packhouseGridSizeOf } from './factoryFloor';
import { wallFacingOf } from './floorCommands';
import { economicPower } from '../environment/ecology';
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

  it('takes its Drive on the left with a left-handed Strapper', () => {
    const leftDriven = [put('packhouseShaft', 1, 2, 1), put('packhouseMotor', 0, 2, 3)];
    const fixtures = withMiddle([put('packhouseStrapperLeft', 2, 2), ...leftDriven, put('packhouseConveyor', 2, 3)]);
    expect(lined(fixtures)).toContain('packhouseStrapperLeft');
    const fromTheRight = withMiddle([put('packhouseStrapperLeft', 2, 2), ...driven(2, 2), put('packhouseConveyor', 2, 3)]);
    expect(floorLinksOf(fromTheRight).lined.size).toBe(0);
  });

  it('adds a little yield for each Strapper beyond the first', () => {
    const one = withMiddle([put('packhouseStrapper', 2, 2), ...driven(2, 2), put('packhouseConveyor', 2, 3)]);
    const two = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseStrapper', 2, 2), ...driven(2, 2), put('packhouseStrapper', 2, 3), ...driven(2, 3), put('packhouseConveyor', 2, 4), put('packhouseExitCrate', 2, 5, 2)];
    const gain = packhouseBonusOf(two, 5, 'Crate').yield - packhouseBonusOf(one, 5, 'Crate').yield;
    expect(gain).toBeGreaterThan(0);
  });
});

describe('why a Line carries no Packets', () => {
  const exit = (fixtures: VenueFixture[]) => fixtures.find(fixture => fixture.type === 'packhouseExitCrate')!;

  it('says nothing about a Fixture that is on a Line', () => {
    const fixtures = [...simpleLine(), put('packhouseConveyor', 2, 2)];
    expect(lineFaultOf(fixtures, exit(fixtures))).toBeUndefined();
  });

  it('names the broken Fixture that cuts the Line', () => {
    const fixtures = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyor', 2, 2, 0, true), put('packhouseExitCrate', 2, 3, 2)];
    const fault = lineFaultOf(fixtures, exit(fixtures));
    expect(fault).toMatchObject({ kind: 'broken' });
    expect(fault && 'fixture' in fault && fault.fixture.y).toBe(2);
  });

  it('names the Packer that has no Drive, and the Strapper too', () => {
    const noDrive = [put('packhousePacker', 2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyor', 2, 2), put('packhouseExitCrate', 2, 3, 2)];
    expect(lineFaultOf(noDrive, exit(noDrive))).toMatchObject({ kind: 'noDrive' });
    const strapper = withMiddle([put('packhouseStrapper', 2, 2), put('packhouseConveyor', 2, 3)]);
    expect(lineFaultOf(strapper, exit(strapper))).toMatchObject({ kind: 'noDrive' });
  });

  it('names the Fixture that does not carry toward the next one', () => {
    const fixtures = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyor', 2, 2, 2), put('packhouseExitCrate', 2, 3, 2)];
    expect(lineFaultOf(fixtures, exit(fixtures))).toMatchObject({ kind: 'misfacing' });
  });

  it('gives the empty cell where the Line should go on', () => {
    const fixtures = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseExitCrate', 2, 3, 2)];
    expect(lineFaultOf(fixtures, exit(fixtures))).toEqual({ kind: 'deadEnd', cell: { x: 2, y: 2 }, of: exit(fixtures) });
  });
});

describe('a left-handed Packer', () => {
  it('takes its Drive on the left and starts a Line like the other one', () => {
    const fixtures = [put('packhousePackerLeft', 4, 0), put('packhouseShaft', 3, 0, 1), put('packhouseMotor', 2, 0, 3), put('packhouseConveyor', 4, 1), put('packhouseConveyor', 4, 2), put('packhouseExitCrate', 4, 3, 2)];
    expect(floorLinksOf(fixtures).lined.size).toBe(4);
    const fromTheRight = [put('packhousePackerLeft', 4, 0), ...driven(4, 0), put('packhouseConveyor', 4, 1), put('packhouseConveyor', 4, 2), put('packhouseExitCrate', 4, 3, 2)];
    expect(floorLinksOf(fromTheRight).lined.size).toBe(0);
  });

  it('stands against the back wall only, as the other one does', () => {
    expect(wallFacingOf('packhousePackerLeft', { x: 4, y: 0 }, 10)).toBe(0);
    expect(wallFacingOf('packhousePackerLeft', { x: 0, y: 4 }, 10)).toBeUndefined();
  });
});

describe('the Packets of a Line', () => {
  it('go from the mouth of the Packer, through the middle of each Fixture, to the hatch of the Exit', () => {
    const fixtures = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyor', 2, 2), put('packhouseExitCrate', 2, 3, 2)];
    const [path] = linePathsOf(fixtures);
    expect(path!.points).toEqual([{ x: 2.5, y: 0.65 }, { x: 2.5, y: 1.5 }, { x: 2.5, y: 2.5 }, { x: 2.5, y: 3.5 }, { x: 2.5, y: 4.3 }]);
  });

  it('turn at an elbow, and there are none without a Line', () => {
    const fixtures = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyorElbowLeft', 2, 2), put('packhouseExitCrate', 3, 2, 1)];
    const [path] = linePathsOf(fixtures);
    expect(path!.points.at(-2)).toEqual({ x: 3.5, y: 2.5 });
    expect(linePathsOf([put('packhousePacker', 2, 0)])).toEqual([]);
  });

  it('split at a splitting T into a way for each Exit, which share their start', () => {
    const fixtures = [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put('packhouseConveyorSplit', 2, 2), put('packhouseConveyor', 1, 2, 1), put('packhouseExitCrate', 0, 2, 3),
      put('packhouseConveyor', 3, 2, 3), put('packhouseExitBox', 4, 2, 1)];
    const paths = linePathsOf(fixtures);
    expect(paths).toHaveLength(2);
    expect(paths[0]!.source).toBe(paths[1]!.source);
    expect(paths[0]!.points.slice(0, 3)).toEqual(paths[1]!.points.slice(0, 3));
    const ends = paths.map(path => path.points.at(-1)!.x).sort((a, b) => a - b);
    expect(ends[0]).toBeCloseTo(-0.3);
    expect(ends[1]).toBeCloseTo(5.3);
    expect(packhouseBonusOf(fixtures, 5, 'Crate').speed).toBeGreaterThan(0);
    expect(packhouseBonusOf(fixtures, 5, 'Box').speed).toBeGreaterThan(0);
  });

  it('go straight on and off to the side at a straight splitting T, to the side it is made for', () => {
    const build = (type: 'packhouseConveyorSplitStraightRight' | 'packhouseConveyorSplitStraightLeft', sideExit: VenueFixture) => [put('packhousePacker', 2, 0), ...driven(2, 0), put('packhouseConveyor', 2, 1), put(type, 2, 2),
      put('packhouseConveyor', 2, 3), put('packhouseExitCrate', 2, 4, 2), sideExit];
    const right = build('packhouseConveyorSplitStraightRight', put('packhouseExitBox', 3, 2, 1));
    expect(linePathsOf(right)).toHaveLength(2);
    expect(packhouseBonusOf(right, 5, 'Box').speed).toBeGreaterThan(0);
    const wrongSide = build('packhouseConveyorSplitStraightLeft', put('packhouseExitBox', 3, 2, 1));
    expect(linePathsOf(wrongSide)).toHaveLength(1);
    expect(packhouseBonusOf(wrongSide, 5, 'Box').speed).toBe(0);
  });

  it('bring two Lines into one at a straight joining T, from the side it is made for', () => {
    const build = (type: 'packhouseConveyorJoinStraightRight' | 'packhouseConveyorJoinStraightLeft') => [
      put('packhousePacker', 1, 0), ...driven(1, 0), put('packhouseConveyor', 1, 1), put(type, 1, 2), put('packhouseConveyor', 1, 3), put('packhouseExitCrate', 1, 4, 2),
      put('packhousePacker', 4, 0), ...driven(4, 0), put('packhouseConveyor', 4, 1), put('packhouseConveyorElbowRight', 4, 2), put('packhouseConveyor', 3, 2, 1), put('packhouseConveyor', 2, 2, 1),
    ];
    const joined = build('packhouseConveyorJoinStraightRight');
    expect(linePathsOf(joined)).toHaveLength(2);
    expect(linePathsOf(joined).map(path => path.source).sort((a, b) => a - b)).toEqual([joined[0]!.id, joined[7]!.id]);
    const wrongSide = build('packhouseConveyorJoinStraightLeft');
    expect(linePathsOf(wrongSide)).toHaveLength(1);
  });

  it('make a Scanner and the Fixtures of a Line run, so that they move', () => {
    const fixtures = withMiddle([put('packhouseScanner', 2, 2), put('packhouseConveyor', 2, 3)]);
    const motion = floorMotionOf(fixtures);
    for (const fixture of fixtures.filter(fixture => floorLinksOf(fixtures).lined.has(fixture.id))) expect(motion.has(fixture.id)).toBe(true);
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

  it('comes within reach of the cap of the Tier with two Packers and two Strappers', () => {
    const lineA = [put('packhousePacker', 1, 0), ...driven(1, 0), put('packhouseConveyor', 1, 1), put('packhouseStrapper', 1, 2), ...driven(1, 2), put('packhouseConveyor', 1, 3), put('packhouseExitCrate', 1, 4, 2)];
    const lineB = [put('packhousePacker', 6, 0), ...driven(6, 0), put('packhouseConveyor', 6, 1), put('packhouseStrapperLeft', 6, 2), put('packhouseShaft', 5, 2, 1), put('packhouseMotor', 4, 2, 3),
      put('packhouseConveyor', 6, 3), put('packhouseExitCrate', 6, 4, 2)];
    const bonus = packhouseBonusOf([...lineA, ...lineB], 5, 'Crate');
    expect(bonus.speed).toBeGreaterThan(packhouseBalance.speedCaps[4]! * 0.85);
    expect(bonus.yield).toBeGreaterThan(packhouseBalance.yieldCaps[4]! * 0.85);
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

describe('what is worked out about a floor', () => {
  const line = () => [...simpleLine('Crate', [put('packhouseConveyor', 2, 2)])];

  it('is worked out once for a list, and once for a layout however the Condition of the Fixtures wears', () => {
    const fixtures = line();
    expect(floorLinksOf(fixtures)).toBe(floorLinksOf(fixtures));
    expect(linePathsOf(fixtures)).toBe(linePathsOf(fixtures));
    const worn = fixtures.map(fixture => ({ ...fixture, condition: 80 }));
    expect(worn).not.toBe(fixtures);
    expect(floorLinksOf(worn)).toBe(floorLinksOf(fixtures));
    expect(linePathsOf(worn)).toBe(linePathsOf(fixtures));
    expect(linkedExitsOf(worn)).toBe(linkedExitsOf(fixtures));
    expect(floorMotionOf(worn)).toBe(floorMotionOf(fixtures));
  });

  it('is worked out again when a Fixture breaks, moves or turns', () => {
    const fixtures = line();
    const broken = fixtures.map(fixture => (fixture.type === 'packhouseConveyor' ? { ...fixture, broken: true as const } : fixture));
    expect(floorLinksOf(broken)).not.toBe(floorLinksOf(fixtures));
    expect(floorLinksOf(broken).lined.size).toBeLessThan(floorLinksOf(fixtures).lined.size);
    const turned = fixtures.map(fixture => (fixture.type === 'packhouseExitCrate' ? { ...fixture, rotation: 0 as const } : fixture));
    expect(linePathsOf(turned)).not.toBe(linePathsOf(fixtures));
  });
});

describe('the power of a Packhouse floor', () => {
  it('is what its Motors ask, and nothing for a Packhouse with no Motor', () => {
    const bare: Building = { ...createBuilding(1, 'packhouse', 50, 50, 0), tier: 3 };
    expect(economicPower(bare)).toBe(0);
    const motored: Building = { ...bare, floor: { fixtures: simpleLine('Crate', [put('packhouseConveyor', 2, 2)]), nextFixtureId: 100 } };
    expect(floorPowerOfBuilding(motored)).toBeGreaterThan(0);
    expect(economicPower(motored)).toBe(floorPowerOfBuilding(motored));
    const unmotored: Building = { ...bare, floor: { fixtures: [put('packhouseConveyor', 2, 2)], nextFixtureId: 100 } };
    expect(economicPower(unmotored)).toBe(0);
  });

  it('is asked even when no Exit is linked, since the Motors turn all the same', () => {
    const building: Building = { ...createBuilding(1, 'packhouse', 50, 50, 0), tier: 3, floor: { fixtures: [put('packhouseMotor', 2, 2)], nextFixtureId: 100 } };
    expect(floorPowerOfBuilding(building)).toBeGreaterThan(0);
    expect(floorBonusOfBuilding(building, 'wheatCrate').speed).toBe(0);
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

  it('puts an Exit against any edge of the floor, with its back to it', () => {
    const size = packhouseGridSizeOf(5);
    expect(failure(city(), place('packhouseExitCrate', 4, 0, 0))).toBeNull();
    expect(failure(city(), place('packhouseExitCrate', 0, 4, 3))).toBeNull();
    expect(failure(city(), place('packhouseExitCrate', 4, size - 1, 2))).toBeNull();
    expect(failure(city(), place('packhouseExitCrate', size - 1, 4, 1))).toBeNull();
    expect(failure(city(), place('packhouseExitCrate', 0, 4, 0))).toBe('error.tilesOccupied');
    expect(failure(city(), place('packhouseExitCrate', 3, 3, 0))).toBe('error.tilesOccupied');
    expect(failure(city(), place('packhouseExitCrate', 4, size - 1, 0))).toBe('error.tilesOccupied');
  });

  it('turns a Packer or an Exit toward its wall by itself', () => {
    const size = packhouseGridSizeOf(5);
    expect(wallFacingOf('packhouseExitCrate', { x: 4, y: 0 }, size)).toBe(0);
    expect(wallFacingOf('packhouseExitCrate', { x: 0, y: 4 }, size)).toBe(3);
    expect(wallFacingOf('packhouseExitCrate', { x: 4, y: size - 1 }, size)).toBe(2);
    expect(wallFacingOf('packhouseExitCrate', { x: size - 1, y: 4 }, size)).toBe(1);
    expect(wallFacingOf('packhouseExitCrate', { x: 3, y: 3 }, size)).toBeUndefined();
    expect(wallFacingOf('packhousePacker', { x: 0, y: 4 }, size)).toBeUndefined();
    expect(wallFacingOf('packhousePacker', { x: 4, y: 0 }, size)).toBe(0);
  });

  it('limits the Exits of each size by the Tier, not the Exits as a whole', () => {
    const first = send(city(1), place('packhouseExitCrate', 4, 0));
    expect(failure(first, place('packhouseExitCrate', 5, 0))).toBe('error.exitLimitReached');
    expect(failure(first, place('packhouseExitBox', 5, 0))).toBeNull();
    expect(packhouseExitLimitOf(1)).toBe(1);
    expect(failure(send(city(3), place('packhouseExitCrate', 4, 0)), place('packhouseExitCrate', 5, 0))).toBeNull();
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
