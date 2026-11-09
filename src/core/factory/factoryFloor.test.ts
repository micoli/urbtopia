import { describe, expect, it } from 'vitest';
import type { FixtureId, Rotation, VenueFixture } from '../engine/state';
import { floorBenefitsOf, floorBonusOf, floorLinksOf, floorMotionOf, floorMotorLoadOf, floorOverloadedOf } from './factoryFloor';

let nextId = 1;
const put = (type: FixtureId, x: number, y: number, rotation: Rotation = 0, broken = false): VenueFixture => ({ id: nextId++, type, x, y, rotation, ...(broken ? { broken: true as const } : {}) });

// A Tank, a Pump behind it and a Motor beside it, which hands the Pump its Drive: the Flow leaves the Pump through its front.
const pumped = (x: number, y: number, rotation: 0 | 2 = 0): VenueFixture[] => (rotation === 0
  ? [put('factoryTank', x, y - 1), put('factoryPump', x, y), put('factoryMotor', x + 1, y, 1)]
  : [put('factoryTank', x, y + 1, 2), put('factoryPump', x, y, 2), put('factoryMotor', x - 1, y, 3)]);
const linkedTypes = (fixtures: VenueFixture[]) => fixtures.filter(fixture => floorLinksOf(fixtures).linked.has(fixture.id)).map(fixture => fixture.type);

describe('Drive', () => {
  it('reaches a Machine through a Shaft', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryPress', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual(['factoryPress']);
  });

  it('does not reach a Machine whose input faces away', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryPress', 3, 5, 0)];
    expect(linkedTypes(fixtures)).toEqual([]);
  });

  it('does not pass a Shaft sideways', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryPress', 4, 4, 1)];
    expect(linkedTypes(fixtures)).toEqual([]);
  });

  it('turns the other way through Gears meshed rim to rim along the line', () => {
    const chain = (lathe: FixtureId) => [put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryGear', 3, 5), put(lathe, 3, 6, 2)];
    expect(linkedTypes(chain('factoryLatheCcw'))).toEqual(['factoryLatheCcw']);
    expect(linkedTypes(chain('factoryLatheCw'))).toEqual([]);
  });

  it('turns the same way through a single Gear fed by the Motor', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryLatheCw', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual(['factoryLatheCw']);
  });

  it('turns the same way through Gears joined axle to axle', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryGear', 4, 4), put('factoryLatheCw', 4, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual(['factoryLatheCw']);
  });

  it('does not join the rim of a Gear to the axle of another', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryGear', 4, 4, 1), put('factoryPress', 5, 4, 1)];
    expect(linkedTypes(fixtures)).toEqual([]);
  });

  it('jams a chain that is fed in two opposite directions', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryGear', 3, 5), put('factoryMotor', 4, 5, 1), put('factoryPress', 3, 6, 2)];
    const links = floorLinksOf(fixtures);
    expect(links.linked.size).toBe(0);
    expect(links.jammed).toBe(true);
  });

  it('stops at a broken Fixture', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4, 0, true), put('factoryPress', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual([]);
  });

  it('needs a Motor', () => {
    expect(linkedTypes([put('factoryShaft', 3, 4), put('factoryPress', 3, 5, 2)])).toEqual([]);
  });
});

describe('what is read once for a list of Fixtures', () => {
  const fixtures = () => [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryPress', 3, 5, 2)];

  it('is shared by every question asked of the same list, and worked out again for a new list', () => {
    const list = fixtures();
    expect(floorLinksOf(list)).toBe(floorLinksOf(list));
    expect(floorMotionOf(list)).toBe(floorMotionOf(list));
    expect(floorBonusOf(list, 5)).toBe(floorBonusOf(list, 5));
    expect(floorBonusOf(list, 5)).not.toBe(floorBonusOf(list, 1));
    expect(floorLinksOf([...list])).not.toBe(floorLinksOf(list));
  });

  it('follows an edit: a new list without the Shaft has no linked Machine', () => {
    const list = fixtures();
    expect(floorLinksOf(list).linked.size).toBe(1);
    expect(floorLinksOf(list.filter(fixture => fixture.type !== 'factoryShaft')).linked.size).toBe(0);
  });
});

describe('floorMotorLoadOf', () => {
  it('counts the linked Machines a Motor drives out of the ones it can', () => {
    const motor = put('factoryMotor', 3, 3);
    const fixtures = [motor, put('factoryBevelTee', 3, 4, 2), put('factoryPress', 2, 4, 3), put('factoryPress', 4, 4, 1)];
    expect(floorMotorLoadOf(fixtures, motor)).toEqual({ driven: 2, capacity: 3, overloaded: 0 });
    expect(floorMotorLoadOf([motor], motor)).toEqual({ driven: 0, capacity: 3, overloaded: 0 });
  });

  it('counts a Pump and a Boiler that are handed Drive, linked or not', () => {
    const [tank, pump, motor] = pumped(3, 3);
    expect(floorMotorLoadOf([tank!, pump!, motor!], motor!)).toEqual({ driven: 1, capacity: 3, overloaded: 0 });
    const boilerLine = [put('factoryMotor', 6, 3), put('factoryShaft', 6, 4), put('factoryBoiler', 6, 5, 0)];
    expect(floorMotorLoadOf(boilerLine, boilerLine[0]!)).toEqual({ driven: 1, capacity: 3, overloaded: 0 });
  });
});

describe('Flow', () => {
  it('reaches a Machine through Pipes', () => {
    const fixtures = [...pumped(3, 3), put('factoryPipe', 3, 4), put('factoryMixingVat', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual(['factoryMixingVat']);
  });

  it('turns a corner through an Elbow', () => {
    const fixtures = [...pumped(3, 3), put('factoryPipeElbow', 3, 4, 3), put('factoryMixingVat', 4, 4, 1)];
    expect(linkedTypes(fixtures)).toEqual(['factoryMixingVat']);
  });

  it('branches through a Tee', () => {
    const fixtures = [...pumped(3, 3), put('factoryPipeTee', 3, 4, 2), put('factoryMixingVat', 2, 4, 3), put('factoryMixingVat', 4, 4, 1)];
    expect(linkedTypes(fixtures).length).toBe(2);
  });

  it('does not mix with Drive: a Shaft carries no Flow', () => {
    const fixtures = [...pumped(3, 3), put('factoryShaft', 3, 4), put('factoryMixingVat', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual([]);
  });
});

describe('Machines that need both', () => {
  const boiler = () => put('factoryBoiler', 3, 5, 0);
  const driveFeed = () => [put('factoryMotor', 3, 2), put('factoryShaft', 3, 3), put('factoryShaft', 3, 4)];
  const flowFeed = () => [...pumped(3, 8, 2), put('factoryPipe', 3, 7), put('factoryPipe', 3, 6)];

  it('is linked only when it receives both', () => {
    expect(linkedTypes([boiler(), ...driveFeed()])).toEqual([]);
    expect(linkedTypes([boiler(), ...flowFeed()])).toEqual([]);
    expect(linkedTypes([boiler(), ...driveFeed(), ...flowFeed()])).toEqual(['factoryBoiler']);
  });
});

describe('floorBonusOf', () => {
  const lathe = () => [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryLatheCw', 3, 5, 2)];

  it('is nothing on an empty floor', () => {
    expect(floorBonusOf([], 5)).toEqual({ speed: 0, yield: 0, power: 0 });
  });

  it('adds what each linked Machine brings', () => {
    expect(floorBonusOf(lathe(), 5)).toMatchObject({ speed: 0.15, yield: 0.05 });
  });

  it('leaves out a Machine that is not linked', () => {
    expect(floorBonusOf([put('factoryPress', 3, 5, 2)], 5)).toEqual({ speed: 0, yield: 0, power: 0 });
  });

  it('keeps growing with every Machine, less and less, below the cap of the Tier', () => {
    const presses = (count: number) => Array.from({ length: count }, (_, index) => put('factoryPress', 3 + 3 * index, 5, 2)).flatMap(press => [put('factoryMotor', press.x, 3), put('factoryShaft', press.x, 4), press]);
    const speeds = [1, 2, 3, 4, 5, 6].map(count => floorBonusOf(presses(count), 5).speed);
    speeds.slice(1).forEach((speed, index) => expect(speed).toBeGreaterThan(speeds[index]!));
    expect(speeds[5]!).toBeLessThan(0.5);
  });

  it('stays under the cap of the Tier of the Factory', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), put('factoryPress', 3, 5, 2)];
    expect(floorBonusOf(fixtures, 1).speed).toBeLessThan(0.1);
    expect(floorBonusOf(fixtures, 5).speed).toBeCloseTo(0.2);
  });
});

describe('why a Machine is not linked', () => {
  const problemsOf = (fixtures: VenueFixture[], machine: VenueFixture) => floorLinksOf(fixtures).problems.get(machine.id);

  it('has no problem when it is linked', () => {
    const press = put('factoryPress', 3, 5, 2);
    expect(problemsOf([put('factoryMotor', 3, 3), put('factoryShaft', 3, 4), press], press)).toBeUndefined();
  });

  it('lacks Drive when nothing feeds it', () => {
    const press = put('factoryPress', 3, 5, 2);
    expect(problemsOf([press], press)).toEqual(['noDrive']);
  });

  it('turns the wrong way', () => {
    const lathe = put('factoryLatheCcw', 3, 5, 2);
    expect(problemsOf([put('factoryMotor', 3, 3), put('factoryGear', 3, 4), lathe], lathe)).toEqual(['wrongTurn']);
  });

  it('sits on a jammed group', () => {
    const press = put('factoryPress', 3, 6, 2);
    expect(problemsOf([put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryGear', 3, 5), put('factoryMotor', 4, 5, 1), press], press)).toEqual(['jammed']);
  });

  it('lacks Flow when no Pump reaches it', () => {
    const vat = put('factoryMixingVat', 3, 5, 2);
    expect(problemsOf([put('factoryPipe', 3, 4), vat], vat)).toEqual(['noFlow']);
  });

  it('lists what a Machine that needs both is missing', () => {
    const boiler = put('factoryBoiler', 3, 5, 0);
    expect(problemsOf([boiler, put('factoryMotor', 3, 2), put('factoryShaft', 3, 3), put('factoryShaft', 3, 4)], boiler)).toEqual(['noFlow']);
    expect(problemsOf([boiler], boiler)).toEqual(['noDrive', 'noFlow']);
  });
});

describe('Bevel gears', () => {
  it('turns the Drive a quarter turn with an elbow', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryBevel', 3, 4, 3), put('factoryPress', 4, 4, 1)];
    expect(linkedTypes(fixtures)).toEqual(['factoryPress']);
  });

  it('does not join a side the elbow has no cone on', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryBevel', 3, 4, 3), put('factoryPress', 3, 5, 2)];
    expect(linkedTypes(fixtures)).toEqual([]);
  });

  it('shares one Motor between several Machines with a tee', () => {
    const fixtures = [put('factoryMotor', 3, 3), put('factoryBevelTee', 3, 4, 2), put('factoryPress', 2, 4, 3), put('factoryPress', 4, 4, 1)];
    expect(linkedTypes(fixtures)).toEqual(['factoryPress', 'factoryPress']);
    expect(floorBonusOf(fixtures, 5).speed).toBeCloseTo(0.5 - 0.25 * Math.exp(-0.6));
  });

  it('turns the two cones of an elbow the same way about the axes of the floor when they point toward opposite axes', () => {
    const chain = (lathe: FixtureId) => [put('factoryMotor', 3, 3), put('factoryBevel', 3, 4, 3), put(lathe, 4, 4, 1)];
    expect(linkedTypes(chain('factoryLatheCw'))).toEqual(['factoryLatheCw']);
    expect(linkedTypes(chain('factoryLatheCcw'))).toEqual([]);
  });

  it('reverses the turn again through a second elbow', () => {
    const chain = (lathe: FixtureId) => [put('factoryMotor', 3, 3), put('factoryBevel', 3, 4, 3), put('factoryBevel', 4, 4, 1), put(lathe, 4, 5, 2)];
    expect(linkedTypes(chain('factoryLatheCw'))).toEqual(['factoryLatheCw']);
    expect(linkedTypes(chain('factoryLatheCcw'))).toEqual([]);
  });

  it('turns the two opposite sides of a tee the opposite way', () => {
    const sides = (left: FixtureId, right: FixtureId) => [put('factoryMotor', 3, 3), put('factoryBevelTee', 3, 4, 2), put(left, 2, 4, 3), put(right, 4, 4, 1)];
    expect(linkedTypes(sides('factoryLatheCw', 'factoryLatheCw'))).toHaveLength(1);
    expect(linkedTypes(sides('factoryLatheCcw', 'factoryLatheCcw'))).toHaveLength(1);
    expect(linkedTypes(sides('factoryLatheCw', 'factoryLatheCcw')).length + linkedTypes(sides('factoryLatheCcw', 'factoryLatheCw')).length).toBe(2);
  });

  it('gives the cones of a tee the turns of its sides', () => {
    const tee = put('factoryBevelTee', 3, 4, 2);
    const motion = floorMotionOf([put('factoryMotor', 3, 3), tee]);
    const { left, right } = motion.get(tee.id) as Record<string, string>;
    expect(left).not.toBe(right);
  });

  it('adds to the meshes of the Gears that follow', () => {
    const fixtures = (lathe: FixtureId) => [put('factoryMotor', 3, 3), put('factoryBevel', 3, 4, 3), put('factoryGear', 4, 4, 1), put('factoryGear', 5, 4, 1), put(lathe, 6, 4, 1)];
    expect(linkedTypes(fixtures('factoryLatheCcw'))).toEqual(['factoryLatheCcw']);
    expect(linkedTypes(fixtures('factoryLatheCw'))).toEqual([]);
  });
});

describe('what a floor costs and brings', () => {
  const pressLine = (x: number, y: number) => [put('factoryMotor', x, y - 2), put('factoryShaft', x, y - 1), put('factoryPress', x, y, 2)];
  const vat = () => [...pumped(3, 3), put('factoryPipe', 3, 4), put('factoryMixingVat', 3, 5, 2)];

  it('draws the power of its Motors, little when they drive nothing', () => {
    expect(floorBonusOf([put('factoryMotor', 3, 3), put('factoryMotor', 6, 3)], 5).power).toBeCloseTo(0.4);
    expect(floorBonusOf(pressLine(3, 5), 5).power).toBeCloseTo(0.2 + 0.8 / 3);
  });

  it('stops what a Motor has no strength left to drive, the highest ids first', () => {
    const floor = [put('factoryMotor', 3, 3), put('factoryBevelTee', 3, 4, 2), put('factoryShaft', 4, 4, 1), put('factoryBevelTee', 5, 4, 1), put('factoryPress', 5, 5, 2), put('factoryPress', 5, 3, 0),
      put('factoryShaft', 2, 4, 3), put('factoryBevelTee', 1, 4, 3), put('factoryPress', 1, 3, 0), put('factoryPress', 1, 5, 2)];
    const presses = floor.filter(fixture => fixture.type === 'factoryPress');
    const { linked, problems } = floorLinksOf(floor);
    expect(linked.size).toBe(3);
    expect(problems.get(presses[3]!.id)).toEqual(['overloaded']);
    expect(floorMotorLoadOf(floor, floor[0]!)).toEqual({ driven: 3, capacity: 3, overloaded: 1 });
    expect(floorOverloadedOf(floor)).toEqual(new Set([presses[3]!.id]));
  });

  it('pays for the kinds of Machine that run, not for their number', () => {
    const alike = [...pressLine(6, 5), ...pressLine(8, 5)];
    expect(floorBonusOf([...pressLine(6, 5), ...vat()], 5).yield).toBeCloseTo(0.1 + 0.03);
    expect(floorBonusOf(alike, 5).yield).toBe(0);
  });

  it('adds to the Machines of a Motor that stands beside a Cooling vat that runs', () => {
    const cooled = (motorX: number) => [...vat(), put('factoryMotor', motorX, 5), put('factoryShaft', motorX, 6), put('factoryPress', motorX, 7, 2)];
    expect(floorBonusOf(cooled(4), 5).speed).toBeCloseTo(0.2 * 1.25);
    expect(floorBonusOf(cooled(7), 5).speed).toBeCloseTo(0.2);
  });

  it('cools twice as well when a Boiler sits on the same circuit of Flow', () => {
    const circuit = (boiler: boolean) => [...pumped(3, 3), put('factoryPipeTee', 3, 4, 2), put('factoryMixingVat', 2, 4, 3), put('factoryMotor', 2, 5, 1), put('factoryShaft', 1, 5, 1), put('factoryPress', 0, 5, 3),
      ...(boiler ? [put('factoryBoiler', 4, 4, 1), put('factoryMotor', 5, 4, 1)] : [])];
    const press = (boiler: boolean) => {
      const fixtures = circuit(boiler);
      return floorBenefitsOf(fixtures, fixtures.find(fixture => fixture.type === 'factoryPress')!).speed;
    };
    expect(press(false)).toBeCloseTo(0.2 * 1.25);
    expect(press(true)).toBeCloseTo(0.2 * 1.5);
  });

  it('saves a share of the Motors\' electricity for every Boiler that runs', () => {
    const fixtures = [...pumped(3, 3), put('factoryPipeTee', 3, 4, 2), put('factoryMixingVat', 2, 4, 3), put('factoryBoiler', 4, 4, 1), put('factoryMotor', 5, 4, 1)];
    const boiler = fixtures.find(fixture => fixture.type === 'factoryBoiler')!;
    expect(floorLinksOf(fixtures).linked.has(boiler.id)).toBe(true);
    const motors = 2;
    const busy = 2 / (motors * 3);
    expect(floorBonusOf(fixtures, 5).power).toBeCloseTo(motors * (0.2 + 0.8 * busy) * 0.75);
    expect(floorBenefitsOf(fixtures, boiler).powerSaving).toBe(0.25);
  });
});

describe('Flow from a Tank', () => {
  const vat = () => put('factoryMixingVat', 3, 5, 2);

  it('needs a Pump that is handed Drive to leave the Tank', () => {
    const [tank, pump, motor] = pumped(3, 3);
    expect(linkedTypes([tank!, pump!, motor!, put('factoryPipe', 3, 4), vat()])).toEqual(['factoryMixingVat']);
    expect(linkedTypes([tank!, pump!, put('factoryPipe', 3, 4), vat()])).toEqual([]);
  });

  it('does not reach a Machine from a Tank with no Pump, nor one on the Tank side of a Pump', () => {
    expect(linkedTypes([put('factoryTank', 3, 4), vat()])).toEqual([]);
    const behind = put('factoryMixingVat', 3, 1, 0);
    expect(linkedTypes([...pumped(3, 3), put('factoryPipe', 3, 4), vat(), behind])).toEqual(['factoryMixingVat']);
  });

  it('goes on through a second Pump handed its own Drive', () => {
    const second = [put('factoryPump', 3, 5), put('factoryMotor', 4, 5, 1)];
    const far = put('factoryMixingVat', 3, 7, 2);
    expect(linkedTypes([...pumped(3, 3), put('factoryPipe', 3, 4), ...second, put('factoryPipe', 3, 6), far])).toEqual(['factoryMixingVat']);
    expect(linkedTypes([...pumped(3, 3), put('factoryPipe', 3, 4), put('factoryPump', 3, 5), put('factoryPipe', 3, 6), far])).toEqual([]);
  });
});

describe('a Tank and its Cooling vats', () => {
  const circuit = () => [...pumped(3, 6), put('factoryPipeTee', 3, 7, 2), put('factoryPipeTee', 2, 7, 3), put('factoryPipeTee', 2, 8, 2),
    put('factoryMixingVat', 2, 6, 0), put('factoryMixingVat', 1, 8, 3), put('factoryMixingVat', 3, 8, 1), put('factoryMixingVat', 4, 7, 1)];

  it('feeds three of them and leaves the one with the highest id without Flow', () => {
    const fixtures = circuit();
    const vats = fixtures.filter(fixture => fixture.type === 'factoryMixingVat');
    const { linked, problems } = floorLinksOf(fixtures);
    expect(vats.filter(vat => linked.has(vat.id))).toHaveLength(3);
    expect(problems.get(vats[3]!.id)).toEqual(['tankFull']);
  });

  it('feeds them all with a second Tank', () => {
    const fixtures = [...circuit(), ...pumped(8, 6)];
    expect(floorLinksOf(fixtures).linked.size).toBe(3);
  });
});

describe('floorMotionOf', () => {
  it('gives each cone of a bevel gear the turn of its own side', () => {
    const elbow = put('factoryBevel', 3, 4, 3);
    const motion = floorMotionOf([put('factoryMotor', 3, 3), elbow]);
    expect(motion.get(elbow.id)).toEqual({ right: 'cw', front: 'cw' });
  });

  it('turns what carries Drive, each Gear the other way, and the linked Machines', () => {
    const [motor, gearA, gearB, lathe] = [put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryGear', 3, 5), put('factoryLatheCcw', 3, 6, 2)];
    const motion = floorMotionOf([motor, gearA, gearB, lathe]);
    expect([motor, gearA, gearB, lathe].map(fixture => motion.get(fixture.id))).toEqual(['cw', 'cw', 'ccw', 'ccw']);
  });

  it('turns a Machine that only needs Flow once it is linked', () => {
    const vat = put('factoryMixingVat', 3, 5, 2);
    expect(floorMotionOf([...pumped(3, 3), put('factoryPipe', 3, 4), vat]).get(vat.id)).toBe('cw');
    expect(floorMotionOf([vat]).has(vat.id)).toBe(false);
  });

  it('turns a Pump whose Flow reaches a linked Machine, and not one that serves none', () => {
    const idle = pumped(6, 3);
    const lone = idle.find(fixture => fixture.type === 'factoryPump')!;
    const served = pumped(3, 3);
    const pump = served.find(fixture => fixture.type === 'factoryPump')!;
    const vat = put('factoryMixingVat', 3, 5, 2);
    const motion = floorMotionOf([...served, put('factoryPipe', 3, 4), vat, ...idle]);
    expect(motion.has(pump.id)).toBe(true);
    expect(motion.has(lone.id)).toBe(false);
  });

  it('turns nothing in a jammed group, nor a Machine that is not linked', () => {
    const press = put('factoryPress', 3, 6, 2);
    const motion = floorMotionOf([put('factoryMotor', 3, 3), put('factoryGear', 3, 4), put('factoryGear', 3, 5), put('factoryMotor', 4, 5, 1), press]);
    expect(motion.size).toBe(0);
  });
});
